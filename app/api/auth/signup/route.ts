import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { signupSchema } from "@/validations/auth";
import { formatZodError } from "@/lib/validation-error";

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

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
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
  } catch {
    return Response.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}