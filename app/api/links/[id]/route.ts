import { Types } from "mongoose";

import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { Link } from "@/models/Link";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return Response.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) {
      return Response.json(
        {
          success: false,
          message: "Invalid link id",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const allowedStatuses = ["active", "disabled"];
    if (!allowedStatuses.includes(body.status)) {
      return Response.json(
        {
          success: false,
          message: "Invalid status",
        },
        { status: 400 }
      );
    }

    await connectDB();
    const link = await Link.findOneAndUpdate({
        _id: id,
        userId: user.id,
      },
      {
        status: body.status,
      },
      {
        new: true,
      }
    );

    if (!link) {
      return Response.json(
        {
          success: false,
          message: "Link not found",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "Link updated successfully",
      data: {
        id: link._id.toString(),
        status: link.status,
      },
    });
  } catch (error) {
    console.error("UPDATE_LINK_ERROR:", error);

    return Response.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return Response.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      return Response.json(
        {
          success: false,
          message: "Invalid link id",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const deletedLink = await Link.findOneAndDelete({
      _id: id,
      userId: user.id,
    });

    if (!deletedLink) {
      return Response.json(
        {
          success: false,
          message: "Link not found",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "Link deleted successfully",
    });
  } catch (error) {
    console.error("DELETE_LINK_ERROR:", error);

    return Response.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}