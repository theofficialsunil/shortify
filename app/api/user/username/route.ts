import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatZodError } from "@/lib/validation-error";
import { User } from "@/models/User";
import { usernameSchema } from "@/validations/user";

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

    const parsedBody = usernameSchema.safeParse(body);

    if (!parsedBody.success) {
      return Response.json(
        {
          success: false,
          errors: formatZodError(parsedBody.error),
        },
        { status: 400 }
      );
    }

    const { username } = parsedBody.data;

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
        username,
        usernameSetupCompleted: true,
      },
      { new: true }
    );

    return Response.json({
      success: true,
      message: "Username updated successfully",
      data: {
        username: updatedUser.username,
        usernameSetupCompleted: updatedUser.usernameSetupCompleted,
      },
    });
  } catch (error) {
    console.error("USERNAME_UPDATE_ERROR:", error);

    return Response.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}