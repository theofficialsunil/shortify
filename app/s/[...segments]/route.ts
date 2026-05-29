import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { Link } from "@/models/Link";

type RouteContext = {
  params: Promise<{
    segments: string[];
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { segments } = await context.params;

    await connectDB();

    let link = null;

    if (segments.length === 1) {
      const [slug] = segments;

      link = await Link.findOne({
        shortCode: slug,
        linkType: "short",
        status: "active",
      });
    }

    if (segments.length === 2) {
      const [username, alias] = segments;

      link = await Link.findOne({
        username: username.toLowerCase(),
        customAlias: alias.toLowerCase(),
        linkType: "custom",
        status: "active",
      });
    }

    if (!link) {
      return new Response("Short link not found", { status: 404 });
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return new Response("This short link has expired", { status: 410 });
    }

    if (link.password) {
      return new Response("Password-protected links will be handled later", {
        status: 403,
      });
    }

    link.totalClicks += 1;
    link.lastClickedAt = new Date();
    await link.save();

    return NextResponse.redirect(link.originalUrl);
  } catch (error) {
    console.error("SHORT_REDIRECT_ERROR:", error);

    return new Response("Something went wrong", { status: 500 });
  }
}