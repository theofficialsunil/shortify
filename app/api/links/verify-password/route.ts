import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";

import { connectDB } from "@/lib/db";
import { lookupGeoByIp } from "@/lib/geo";
import { verifyPasswordRateLimit } from "@/lib/rate-limit";
import {
  createTrackingId,
  detectBot,
  getClientIp,
  getGeoData,
  getLanguage,
  getRateLimitIdentifier,
  getRefererDomain,
  getReferrer,
  getUtmData,
  getUserAgent,
  hashIp,
  parseUserAgent,
} from "@/lib/request";
import { Click } from "@/models/Click";
import { Link } from "@/models/Link";

export async function POST(request: Request) {
  try {
    const identifier = getRateLimitIdentifier(request);

    const rateLimit = await verifyPasswordRateLimit.limit(identifier);

    if (!rateLimit.success) {
      return Response.json(
        {
          success: false,
          message: "Too many password attempts. Try again later.",
        },
        { status: 429 }
      );
    }

    const body = await request.json();

    const linkId = body.linkId;
    const password = body.password;

    if (!linkId || !Types.ObjectId.isValid(linkId)) {
      return Response.json(
        {
          success: false,
          message: "Invalid link",
        },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return Response.json(
        {
          success: false,
          message: "Password is required",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const link = await Link.findById(linkId);

    if (!link) {
      return Response.json(
        {
          success: false,
          message: "Link not found",
        },
        { status: 404 }
      );
    }

    if (link.status !== "active") {
      return Response.json(
        {
          success: false,
          message: "This link is disabled",
        },
        { status: 403 }
      );
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return Response.json(
        {
          success: false,
          message: "This link has expired",
        },
        { status: 410 }
      );
    }

    if (!link.password) {
      return Response.json({
        success: true,
        data: {
          originalUrl: link.originalUrl,
        },
      });
    }

    const isPasswordValid = await bcrypt.compare(password, link.password);

    if (!isPasswordValid) {
      return Response.json(
        {
          success: false,
          message: "Incorrect password",
        },
        { status: 401 }
      );
    }

    const userAgent = getUserAgent(request);
    const referrer = getReferrer(request);
    const ip = getClientIp(request);

    const visitorId =
      request.headers
        .get("cookie")
        ?.split("; ")
        .find((cookie) => cookie.startsWith("shortify_visitor_id="))
        ?.split("=")[1] || createTrackingId();

    const sessionId =
      request.headers
        .get("cookie")
        ?.split("; ")
        .find((cookie) => cookie.startsWith("shortify_session_id="))
        ?.split("=")[1] || createTrackingId();

    const headerGeoData = getGeoData(request);
    const geoData = await lookupGeoByIp(ip, headerGeoData);
    const utmData = getUtmData(request);
    const deviceData = parseUserAgent(userAgent);

    await Click.create({
      linkId: link._id,
      userId: link.userId,

      clickedAt: new Date(),

      referrer,
      refererDomain: getRefererDomain(referrer),

      visitorId,
      sessionId,

      ipHash: hashIp(ip),

      country: geoData.country,
      region: geoData.region,
      city: geoData.city,
      latitude: geoData.latitude,
      longitude: geoData.longitude,
      timezone: geoData.timezone,

      deviceType: deviceData.deviceType,
      browser: deviceData.browser,
      os: deviceData.os,

      language: getLanguage(request),

      utmSource: utmData.utmSource,
      utmMedium: utmData.utmMedium,
      utmCampaign: utmData.utmCampaign,

      isBot: detectBot(userAgent),
    });

    link.totalClicks += 1;
    link.lastClickedAt = new Date();
    await link.save();

    const response = NextResponse.json({
      success: true,
      message: "Password verified",
      data: {
        originalUrl: link.originalUrl,
      },
    });

    response.cookies.set("shortify_visitor_id", visitorId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });

    response.cookies.set("shortify_session_id", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 30,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("VERIFY_LINK_PASSWORD_ERROR:", error);

    return Response.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}