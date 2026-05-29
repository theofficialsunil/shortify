import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json(
      {
        success: false,
        message: "Unauthorized",
      },
      { status: 401 }
    );
  }

  return Response.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      usernameSetupCompleted: user.usernameSetupCompleted,
    },
  });
}