import { Types } from "mongoose";

import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { Click } from "@/models/Click";
import { Link } from "@/models/Link";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type CountMap = Record<string, number>;

function incrementCounter(map: CountMap, key?: string | null) {
  const finalKey = key && key.trim() ? key : "Unknown";
  map[finalKey] = (map[finalKey] || 0) + 1;
}

function toBreakdown(map: CountMap) {
  return Object.entries(map)
    .map(([name, count]) => ({
      name,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

function formatDay(date: Date) {
  return date.toISOString().split("T")[0];
}

export async function GET(_request: Request, context: RouteContext) {
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

    const link = await Link.findOne({
      _id: id,
      userId: user.id,
    });

    if (!link) {
      return Response.json(
        {
          success: false,
          message: "Link not found",
        },
        { status: 404 }
      );
    }

    const clicks = await Click.find({
      linkId: id,
      userId: user.id,
    })
      .sort({ clickedAt: -1 })
      .lean();

    const deviceMap: CountMap = {};
    const browserMap: CountMap = {};
    const osMap: CountMap = {};
    const countryMap: CountMap = {};
    const regionMap: CountMap = {};
    const cityMap: CountMap = {};
    const referrerMap: CountMap = {};
    const utmSourceMap: CountMap = {};
    const dailyMap: CountMap = {};

    let botClicks = 0;

    clicks.forEach((click) => {
      incrementCounter(deviceMap, click.deviceType);
      incrementCounter(browserMap, click.browser);
      incrementCounter(osMap, click.os);
      incrementCounter(countryMap, click.country);
      incrementCounter(regionMap, click.region);
      incrementCounter(cityMap, click.city);
      incrementCounter(referrerMap, click.refererDomain);
      incrementCounter(utmSourceMap, click.utmSource || "Direct");

      if (click.isBot) {
        botClicks++;
      }

      const day = formatDay(new Date(click.clickedAt));
      incrementCounter(dailyMap, day);
    });

    const clicksOverTime = Object.entries(dailyMap)
      .map(([date, count]) => ({
        date,
        count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const shortUrl =
      link.linkType === "custom"
        ? `${baseUrl}/s/${link.username}/${link.customAlias}`
        : `${baseUrl}/s/${link.shortCode}`;

    return Response.json({
      success: true,
      data: {
        link: {
          id: link._id.toString(),
          originalUrl: link.originalUrl,
          shortUrl,
          linkType: link.linkType,
          status: link.status,
          totalClicks: link.totalClicks,
          createdAt: link.createdAt,
          expiresAt: link.expiresAt,
          lastClickedAt: link.lastClickedAt,
        },

        summary: {
          totalClicks: clicks.length,
          uniqueVisitors: new Set(clicks.map((click) => click.visitorId)).size,
          sessions: new Set(clicks.map((click) => click.sessionId)).size,
          botClicks,
          humanClicks: clicks.length - botClicks,
        },

        clicksOverTime,

        breakdowns: {
          devices: toBreakdown(deviceMap),
          browsers: toBreakdown(browserMap),
          os: toBreakdown(osMap),
          countries: toBreakdown(countryMap),
          regions: toBreakdown(regionMap),
          cities: toBreakdown(cityMap),
          referrers: toBreakdown(referrerMap),
          utmSources: toBreakdown(utmSourceMap),
        },

        recentClicks: clicks.slice(0, 20).map((click) => ({
          id: click._id.toString(),
          clickedAt: click.clickedAt,
          referrer: click.referrer,
          refererDomain: click.refererDomain,
          country: click.country,
          region: click.region,
          city: click.city,
          deviceType: click.deviceType,
          browser: click.browser,
          os: click.os,
          language: click.language,
          utmSource: click.utmSource,
          utmMedium: click.utmMedium,
          utmCampaign: click.utmCampaign,
          isBot: click.isBot,
        })),
      },
    });
  } catch (error) {
    console.error("LINK_ANALYTICS_ERROR:", error);

    return Response.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}