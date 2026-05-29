import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/db";
import {
  generateUniqueUsername,
  generateUsernameFromEmail,
} from "@/lib/username";
import { formatZodError } from "@/lib/validation-error";
import { User } from "@/models/User";
import { signupSchema } from "@/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsedBody = signupSchema.safeParse(body);

    if (!parsedBody.success) {
      return Response.json(
        {
          success: false,
          errors: formatZodError(parsedBody.error),
        },
        { status: 400 }
      );
    }

    const { name, email, password } = parsedBody.data;

    await connectDB();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return Response.json(
        {
          success: false,
          message: "User already exists",
        },
        { status: 409 }
      );
    }

    const baseUsername = generateUsernameFromEmail(email);
    const username = await generateUniqueUsername(
      baseUsername,
      async (username) => {
        const existingUsername = await User.findOne({ username });
        return Boolean(existingUsername);
      }
    );

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      username,
      usernameSetupCompleted: false,
      email,
      password: hashedPassword,
      provider: "credentials",
    });

    return Response.json(
      {
        success: true,
        message: "Account created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("SIGNUP_ERROR:", error);

    return Response.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}