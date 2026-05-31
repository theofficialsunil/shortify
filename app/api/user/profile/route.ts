import { z } from "zod";

import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatZodError } from "@/lib/validation-error";
import { User } from "@/models/User";
import { usernameSchema } from "@/validations/user";

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),

  username: usernameSchema.shape.username,
});

export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.id) {
      return Response.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const parsedBody = profileSchema.safeParse(body);

    if (!parsedBody.success) {
      return Response.json(
        {
          success: false,
          errors: formatZodError(parsedBody.error),
        },
        { status: 400 }
      );
    }

    const { name, username } = parsedBody.data;

    await connectDB();

    const existingUsername = await User.findOne({
      username,
      _id: { $ne: currentUser.id },
    });

    if (existingUsername) {
      return Response.json(
        {
          success: false,
          message: "Username already taken",
        },
        { status: 409 }
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      currentUser.id,
      {
        name,
        username,
        usernameSetupCompleted: true,
      },
      {
        returnDocument: "after",
      }
    );

    if (!updatedUser) {
      return Response.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        username: updatedUser.username,
        usernameSetupCompleted: updatedUser.usernameSetupCompleted,
      },
    });
  } catch (error) {
    console.error("PROFILE_UPDATE_ERROR:", error);

    return Response.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}