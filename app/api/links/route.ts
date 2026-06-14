import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/db";
import { getExpirationDate } from "@/lib/expiration";
import { createLinkRateLimit } from "@/lib/rate-limit";
import { getRateLimitIdentifier } from "@/lib/request";
import { getCurrentUser } from "@/lib/session";
import { generateShortCode, normalizeAlias } from "@/lib/short-code";
import { formatZodError } from "@/lib/validation-error";
import { Link } from "@/models/Link";
import { User } from "@/models/User";
import { createLinkSchema } from "@/validations/link";

const RESERVED_USER_ALIASES = ["new", "edit", "settings", "admin"];

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
    lastClickedAt: link.lastClickedAt || null,
    passwordProtected: Boolean(link.password),
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
  };
}

export async function GET() {
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

    await connectDB();

    const links = await Link.find({ userId: currentUser.id })
      .sort({ createdAt: -1 })
      .lean();

    const formattedLinks = links.map((link) => formatLink(link));

    return Response.json({
      success: true,
      data: formattedLinks,
    });
  } catch (error) {
    console.error("GET_LINKS_ERROR:", error);

    return Response.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const identifier = getRateLimitIdentifier(request);
    const rateLimit = await createLinkRateLimit.limit(identifier);

    if (!rateLimit.success) {
      return Response.json(
        {
          success: false,
          message: "Too many links created. Try again later.",
        },
        { status: 429 }
      );
    }

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
    const parsedBody = createLinkSchema.safeParse(body);

    if (!parsedBody.success) {
      return Response.json(
        {
          success: false,
          errors: formatZodError(parsedBody.error),
        },
        { status: 400 }
      );
    }

    const {
      originalUrl,
      customAlias,
      description,
      expiration,
      passwordProtected,
      password,
    } = parsedBody.data;

    await connectDB();

    const user = await User.findById(currentUser.id);

    if (!user) {
      return Response.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    if (!user.usernameSetupCompleted) {
      return Response.json(
        {
          success: false,
          message: "Please complete username setup first",
        },
        { status: 403 }
      );
    }

    const normalizedAlias = normalizeAlias(customAlias);

    if (normalizedAlias && RESERVED_USER_ALIASES.includes(normalizedAlias)) {
      return Response.json(
        {
          success: false,
          message: "This alias is reserved",
        },
        { status: 400 }
      );
    }

    let shortCode = "";
    let linkType: "short" | "custom" = "short";

    if (normalizedAlias) {
      linkType = "custom";

      const existingAlias = await Link.findOne({
        username: user.username,
        customAlias: normalizedAlias,
      });

      if (existingAlias) {
        return Response.json(
          {
            success: false,
            message: "You already used this alias",
          },
          { status: 409 }
        );
      }
    } else {
      shortCode = generateShortCode();

      while (await Link.findOne({ shortCode })) {
        shortCode = generateShortCode();
      }
    }

    const expiresAt = getExpirationDate(expiration);

    const hashedPassword =
      passwordProtected && password ? await bcrypt.hash(password, 10) : null;

    const linkPayload = normalizedAlias
      ? {
          originalUrl,
          customAlias: normalizedAlias,
          username: user.username,
          linkType,
          userId: user._id,
          description: description || "",
          expiresAt,
          password: hashedPassword,
          status: "active",
        }
      : {
          originalUrl,
          shortCode,
          linkType,
          userId: user._id,
          description: description || "",
          expiresAt,
          password: hashedPassword,
          status: "active",
        };

    const link = await Link.create(linkPayload);

    return Response.json(
      {
        success: true,
        message: "Link created successfully",
        data: formatLink(link),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE_LINK_ERROR:", error);

    return Response.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}