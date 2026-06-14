import bcrypt from "bcryptjs";
import { Types } from "mongoose";

import { connectDB } from "@/lib/db";
import { getExpirationDate } from "@/lib/expiration";
import { getCurrentUser } from "@/lib/session";
import { formatZodError } from "@/lib/validation-error";
import { Link } from "@/models/Link";
import { updateLinkSchema } from "@/validations/link";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function getShortUrl(link: any) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  if (link.linkType === "custom") {
    return `${baseUrl}/s/${link.username}/${link.customAlias}`;
  }

  return `${baseUrl}/s/${link.shortCode}`;
}

function formatLink(link: any) {
  return {
    id: link._id.toString(),
    originalUrl: link.originalUrl,
    shortCode: link.shortCode || null,
    customAlias: link.customAlias || null,
    username: link.username || null,
    linkType: link.linkType,
    shortUrl: getShortUrl(link),
    description: link.description || "",
    expiresAt: link.expiresAt,
    status: link.status,
    totalClicks: link.totalClicks,
    passwordProtected: Boolean(link.password),
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
  };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.id) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      return Response.json(
        { success: false, message: "Invalid link ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const link = await Link.findOne({
      _id: id,
      userId: currentUser.id,
    });

    if (!link) {
      return Response.json(
        { success: false, message: "Link not found" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: formatLink(link),
    });
  } catch (error) {
    console.error("GET_LINK_ERROR:", error);

    return Response.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.id) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      return Response.json(
        { success: false, message: "Invalid link ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsedBody = updateLinkSchema.safeParse(body);

    if (!parsedBody.success) {
      return Response.json(
        { success: false, errors: formatZodError(parsedBody.error) },
        { status: 400 }
      );
    }

    await connectDB();

    const link = await Link.findOne({
      _id: id,
      userId: currentUser.id,
    });

    if (!link) {
      return Response.json(
        { success: false, message: "Link not found" },
        { status: 404 }
      );
    }

    const {
      originalUrl,
      description,
      status,
      expiration,
      passwordProtected,
      password,
      removePassword,
    } = parsedBody.data;

    if (originalUrl !== undefined) {
      link.originalUrl = originalUrl;
    }

    if (description !== undefined) {
      link.description = description;
    }

    if (status !== undefined) {
      link.status = status;
    }

    if (expiration !== undefined) {
      link.expiresAt = getExpirationDate(expiration);
    }

    if (removePassword || passwordProtected === false) {
      link.password = null;
    }

    if (passwordProtected === true) {
      if (password) {
        link.password = await bcrypt.hash(password, 10);
      } else if (!link.password) {
        return Response.json(
          {
            success: false,
            message: "Password is required to enable password protection",
          },
          { status: 400 }
        );
      }
    }

    await link.save();

    return Response.json({
      success: true,
      message: "Link updated successfully",
      data: formatLink(link),
    });
  } catch (error) {
    console.error("UPDATE_LINK_ERROR:", error);

    return Response.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.id) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      return Response.json(
        { success: false, message: "Invalid link ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const deletedLink = await Link.findOneAndDelete({
      _id: id,
      userId: currentUser.id,
    });

    if (!deletedLink) {
      return Response.json(
        { success: false, message: "Link not found" },
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
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}