import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { Click } from "@/models/Click";

type GeoCount = {
  name: string;
  count: number;
};

function toBreakdown(map: Record<string, number>): GeoCount[] {
  return Object.entries(map)
    .map(([name, count]) => ({
      name,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

function addToMap(map: Record<string, number>, value?: string | null) {
  const key = value && value.trim() ? value : "Unknown";
  map[key] = (map[key] || 0) + 1;
}

export async function GET() {
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

    await connectDB();

    const clicks = await Click.find({
      userId: user.id,
    })
      .sort({ clickedAt: -1 })
      .lean();

    const countryMap: Record<string, number> = {};
    const regionMap: Record<string, number> = {};
    const cityMap: Record<string, number> = {};

    clicks.forEach((click) => {
      addToMap(countryMap, click.country);
      addToMap(regionMap, click.region);
      addToMap(cityMap, click.city);
    });

    const countries = toBreakdown(countryMap);
    const regions = toBreakdown(regionMap);
    const cities = toBreakdown(cityMap);

    const knownCountryClicks = countries
      .filter((item) => item.name !== "Unknown")
      .reduce((sum, item) => sum + item.count, 0);

    const geoUnavailable =
      clicks.length === 0 ||
      countries.length === 0 ||
      knownCountryClicks === 0;

    return Response.json({
      success: true,
      data: {
        totalClicks: clicks.length,
        knownCountryClicks,
        geoUnavailable,
        countries,
        regions,
        cities,
        recentLocations: clicks.slice(0, 20).map((click) => ({
          id: click._id.toString(),
          clickedAt: click.clickedAt,
          country: click.country || "Unknown",
          region: click.region || "Unknown",
          city: click.city || "Unknown",
          deviceType: click.deviceType || "Unknown",
          browser: click.browser || "Unknown",
          os: click.os || "Unknown",
          language: click.language || "Unknown",
          isBot: Boolean(click.isBot),
        })),
      },
    });
  } catch (error) {
    console.error("GEO_ANALYTICS_ERROR:", error);

    return Response.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}