import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/db";
import { loginRateLimit } from "@/lib/rate-limit";
import {
  generateUniqueUsername,
  generateUsernameFromEmail,
} from "@/lib/username";
import { User } from "@/models/User";
import { loginSchema } from "@/validations/auth";

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Credentials",

    credentials: {
      email: {
        label: "Email",
        type: "email",
      },
      password: {
        label: "Password",
        type: "password",
      },
    },

    async authorize(credentials) {
      const parsedCredentials = loginSchema.safeParse(credentials);

      const identifier = parsedCredentials.success
        ? parsedCredentials.data.email
        : "invalid-login";

      const { success } = await loginRateLimit.limit(identifier);

      if (!success) {
        throw new Error("Too many login attempts. Try again later.");
      }

      if (!parsedCredentials.success) {
        return null;
      }

      const { email, password } = parsedCredentials.data;

      await connectDB();

      const user = await User.findOne({ email });

      if (!user || !user.password) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return null;
      }

      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        username: user.username,
        usernameSetupCompleted: user.usernameSetupCompleted,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  providers,

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true;
      }

      if (!user.email) {
        return false;
      }

      await connectDB();

      const email = user.email.toLowerCase();

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        let shouldSave = false;

        if (!existingUser.image && user.image) {
          existingUser.image = user.image;
          shouldSave = true;
        }

        if (!existingUser.name && user.name) {
          existingUser.name = user.name;
          shouldSave = true;
        }

        if (shouldSave) {
          await existingUser.save();
        }

        return true;
      }

      const baseUsername = generateUsernameFromEmail(email);

      const username = await generateUniqueUsername(
        baseUsername,
        async (username) => {
          const existingUsername = await User.findOne({ username });
          return Boolean(existingUsername);
        }
      );

      await User.create({
        name: user.name || baseUsername,
        username,
        usernameSetupCompleted: false,
        email,
        password: null,
        image: user.image || null,
        provider: "google",
      });

      return true;
    },

    async jwt({ token, user, account, trigger, session }) {
      if (account?.provider === "google" && token.email) {
        await connectDB();

        const dbUser = await User.findOne({
          email: token.email.toLowerCase(),
        });

        if (dbUser) {
          token.id = dbUser._id.toString();
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.picture = dbUser.image;
          token.username = dbUser.username;
          token.usernameSetupCompleted = dbUser.usernameSetupCompleted;
        }
      }

      if (user && account?.provider === "credentials") {
        token.id = user.id;
        token.name = user.name;
        token.username = user.username;
        token.usernameSetupCompleted = user.usernameSetupCompleted;
      }

      if (trigger === "update" && session?.user) {
        token.name = session.user.name ?? token.name;
        token.username = session.user.username ?? token.username;
        token.usernameSetupCompleted =
          session.user.usernameSetupCompleted ?? token.usernameSetupCompleted;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
        session.user.username = token.username;
        session.user.usernameSetupCompleted = token.usernameSetupCompleted;
      }

      return session;
    },
  },
};