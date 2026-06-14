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

function getValidRange(range: string | null): RangeOption {
  if (range === "7d" || range === "30d" || range === "90d" || range === "all") {
    return range;
  }

  return "30d";
}

function getStartDate(range: RangeOption) {
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

function escapeCsvValue(value: unknown) {
  if (value === null || value === undefined) return "";

  const stringValue = String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function convertToCsv(rows: Record<string, unknown>[]) {
  const headers = [
    "clickedAt",
    "refererDomain",
    "country",
    "region",
    "city",
    "deviceType",
    "browser",
    "os",
    "language",
    "utmSource",
    "utmMedium",
    "utmCampaign",
    "isBot",
  ];

  const csvRows = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCsvValue(row[header])).join(",")
    ),
  ];

  return csvRows.join("\n");
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

    const clicks = await Click.find(match)
      .sort({ clickedAt: -1 })
      .limit(5000)
      .select(
        "clickedAt refererDomain country region city deviceType browser os language utmSource utmMedium utmCampaign isBot"
      )
      .lean();

    const rows = clicks.map((click) => ({
      clickedAt: click.clickedAt
        ? new Date(click.clickedAt).toISOString()
        : "",
      refererDomain: click.refererDomain || "Direct",
      country: click.country || "Unknown",
      region: click.region || "Unknown",
      city: click.city || "Unknown",
      deviceType: click.deviceType || "Unknown",
      browser: click.browser || "Unknown",
      os: click.os || "Unknown",
      language: click.language || "Unknown",
      utmSource: click.utmSource || "",
      utmMedium: click.utmMedium || "",
      utmCampaign: click.utmCampaign || "",
      isBot: click.isBot ? "true" : "false",
    }));

    const csv = convertToCsv(rows);

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="shortify-analytics-${id}-${range}.csv"`,
      },
    });
  } catch (error) {
    console.error("EXPORT_LINK_ANALYTICS_ERROR:", error);

    return Response.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}