import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { lookupGeoByIp } from "@/lib/geo";
import {
  createTrackingId,
  detectBot,
  getClientIp,
  getGeoData,
  getLanguage,
  getRefererDomain,
  getReferrer,
  getUtmData,
  getUserAgent,
  hashIp,
  parseUserAgent,
} from "@/lib/request";
import { Click } from "@/models/Click";
import { Link } from "@/models/Link";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    segments: string[];
  }>;
};

function redirectToStatusPage(request: Request, reason: string) {
  const statusUrl = new URL("/link-status", request.url);
  statusUrl.searchParams.set("reason", reason);

  return NextResponse.redirect(statusUrl);
}

async function trackClick(request: Request, link: any) {
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

  return {
    visitorId,
    sessionId,
  };
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { segments } = await context.params;

    if (segments.length !== 1 && segments.length !== 2) {
      return redirectToStatusPage(request, "invalid");
    }

    await connectDB();

    let link = null;

    if (segments.length === 1) {
      const [slug] = segments;

      link = await Link.findOne({
        shortCode: slug.toLowerCase(),
        linkType: "short",
      });
    }

    if (segments.length === 2) {
      const [username, alias] = segments;

      link = await Link.findOne({
        username: username.toLowerCase(),
        customAlias: alias.toLowerCase(),
        linkType: "custom",
      });
    }

    if (!link) {
      return redirectToStatusPage(request, "not-found");
    }

    if (link.status === "disabled") {
      return redirectToStatusPage(request, "disabled");
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return redirectToStatusPage(request, "expired");
    }

    if (link.password) {
      const protectedUrl = new URL("/protected-link", request.url);
      protectedUrl.searchParams.set("linkId", link._id.toString());

      return NextResponse.redirect(protectedUrl);
    }

    const tracking = await trackClick(request, link);

    const response = NextResponse.redirect(link.originalUrl);

    response.cookies.set("shortify_visitor_id", tracking.visitorId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });

    response.cookies.set("shortify_session_id", tracking.sessionId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 30,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("SHORT_REDIRECT_ERROR:", error);

    return redirectToStatusPage(request, "error");
  }
}