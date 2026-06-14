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

type RangeOption = "7d" | "30d" | "90d" | "all";

function getStartDate(range: string | null) {
  const now = new Date();

  switch (range) {
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    case "all":
      return null;

    case "30d":
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

function getValidRange(range: string | null): RangeOption {
  if (range === "7d" || range === "30d" || range === "90d" || range === "all") {
    return range;
  }

  return "30d";
}

function getShortUrl(link: any) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  if (link.linkType === "custom") {
    return `${baseUrl}/s/${link.username}/${link.customAlias}`;
  }

  return `${baseUrl}/s/${link.shortCode}`;
}

async function getBreakdown(
  match: Record<string, unknown>,
  field: string,
  totalClicks: number,
  limit = 10
) {
  const rows = await Click.aggregate([
    {
      $match: match,
    },
    {
      $group: {
        _id: `$${field}`,
        clicks: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        clicks: -1,
      },
    },
    {
      $limit: limit,
    },
    {
      $project: {
        _id: 0,
        label: {
          $cond: [
            {
              $or: [
                {
                  $eq: ["$_id", null],
                },
                {
                  $eq: ["$_id", ""],
                },
              ],
            },
            "Unknown",
            "$_id",
          ],
        },
        clicks: 1,
      },
    },
  ]);

  return rows.map((row) => ({
    label: row.label,
    clicks: row.clicks,
    percentage: totalClicks > 0 ? Math.round((row.clicks / totalClicks) * 100) : 0,
  }));
}

export async function GET(request: Request, context: RouteContext) {
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

    const { id } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      return Response.json(
        {
          success: false,
          message: "Invalid link ID",
        },
        { status: 400 }
      );
    }

    const url = new URL(request.url);
    const range = getValidRange(url.searchParams.get("range"));
    const startDate = getStartDate(range);

    await connectDB();

    const link = await Link.findOne({
      _id: id,
      userId: currentUser.id,
    }).lean();

    if (!link) {
      return Response.json(
        {
          success: false,
          message: "Link not found",
        },
        { status: 404 }
      );
    }

    const match: Record<string, unknown> = {
      linkId: new Types.ObjectId(id),
      userId: new Types.ObjectId(currentUser.id),
    };

    if (startDate) {
      match.clickedAt = {
        $gte: startDate,
      };
    }

    const [
      totalClicks,
      uniqueVisitors,
      uniqueSessions,
      humanClicks,
      botClicks,
      clicksOverTime,
      recentClicks,
    ] = await Promise.all([
      Click.countDocuments(match),

      Click.distinct("visitorId", match),

      Click.distinct("sessionId", match),

      Click.countDocuments({
        ...match,
        isBot: false,
      }),

      Click.countDocuments({
        ...match,
        isBot: true,
      }),

      Click.aggregate([
        {
          $match: match,
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$clickedAt",
              },
            },
            clicks: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
        {
          $project: {
            _id: 0,
            date: "$_id",
            clicks: 1,
          },
        },
      ]),

      Click.find(match)
        .sort({ clickedAt: -1 })
        .limit(10)
        .select(
          "clickedAt refererDomain country region city deviceType browser os language utmSource utmMedium utmCampaign isBot"
        )
        .lean(),
    ]);

    const [
      devices,
      browsers,
      operatingSystems,
      countries,
      regions,
      cities,
      referrers,
      utmSources,
      utmMediums,
      utmCampaigns,
    ] = await Promise.all([
      getBreakdown(match, "deviceType", totalClicks),
      getBreakdown(match, "browser", totalClicks),
      getBreakdown(match, "os", totalClicks),
      getBreakdown(match, "country", totalClicks),
      getBreakdown(match, "region", totalClicks),
      getBreakdown(match, "city", totalClicks),
      getBreakdown(match, "refererDomain", totalClicks),
      getBreakdown(match, "utmSource", totalClicks),
      getBreakdown(match, "utmMedium", totalClicks),
      getBreakdown(match, "utmCampaign", totalClicks),
    ]);

    return Response.json({
      success: true,
      data: {
        range,
        dateFrom: startDate,
        dateTo: new Date(),

        link: {
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
        },

        summary: {
          totalClicks,
          uniqueVisitors: uniqueVisitors.length,
          uniqueSessions: uniqueSessions.length,
          humanClicks,
          botClicks,
        },

        clicksOverTime,

        breakdowns: {
          devices,
          browsers,
          operatingSystems,
          countries,
          regions,
          cities,
          referrers,
          utmSources,
          utmMediums,
          utmCampaigns,
        },

        recentClicks: recentClicks.map((click) => ({
          id: click._id.toString(),
          clickedAt: click.clickedAt,
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