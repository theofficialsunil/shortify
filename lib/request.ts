import crypto from "crypto";
import { UAParser } from "ua-parser-js";

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");

  if (realIp) {
    return realIp;
  }

  return "unknown";
}

export function hashIp(ip: string) {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

export function getReferrer(request: Request) {
  return request.headers.get("referer") || "Direct";
}

export function getRefererDomain(referrer: string) {
  if (!referrer || referrer === "Direct") {
    return "Direct";
  }

  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return "Unknown";
  }
}

export function getUserAgent(request: Request) {
  return request.headers.get("user-agent") || "";
}

export function getLanguage(request: Request) {
  const acceptLanguage = request.headers.get("accept-language");

  if (!acceptLanguage) {
    return "Unknown";
  }

  return acceptLanguage.split(",")[0] || "Unknown";
}

export function getGeoData(request: Request) {
  return {
    country:
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry") ||
      "Unknown",

    region:
      request.headers.get("x-vercel-ip-country-region") ||
      request.headers.get("x-vercel-ip-region") ||
      "Unknown",

    city:
      request.headers.get("x-vercel-ip-city") ||
      "Unknown",
  };
}

export function getUtmData(request: Request) {
  const url = new URL(request.url);

  return {
    utmSource: url.searchParams.get("utm_source") || "",
    utmMedium: url.searchParams.get("utm_medium") || "",
    utmCampaign: url.searchParams.get("utm_campaign") || "",
  };
}

export function parseUserAgent(userAgent: string) {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const rawDeviceType = result.device.type;

  const deviceType =
    rawDeviceType === "mobile" ||
    rawDeviceType === "tablet" ||
    rawDeviceType === "smarttv" ||
    rawDeviceType === "wearable"
      ? rawDeviceType
      : "desktop";

  return {
    deviceType,
    browser: result.browser.name || "Unknown",
    os: result.os.name || "Unknown",
  };
}

export function detectBot(userAgent: string) {
  const botPattern =
    /bot|crawler|spider|crawling|facebookexternalhit|twitterbot|slackbot|discordbot|linkedinbot|whatsapp|telegrambot|preview/i;

  return botPattern.test(userAgent);
}

export function createTrackingId() {
  return crypto.randomUUID();
}

export function getRateLimitIdentifier(request: Request) {
  return (
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "anonymous"
  );
}