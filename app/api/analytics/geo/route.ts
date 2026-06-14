import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { Click } from "@/models/Click";

async function getBreakdown(field: string, userId: string, limit = 10) {
  const rows = await Click.aggregate([
    {
      $match: {
        userId: userId,
      },
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

  return rows;
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

    const [totalClicks, knownCountryClicks, knownCoordinateClicks] =
      await Promise.all([
        Click.countDocuments({
          userId: currentUser.id,
        }),

        Click.countDocuments({
          userId: currentUser.id,
          country: {
            $ne: "Unknown",
          },
        }),

        Click.countDocuments({
          userId: currentUser.id,
          latitude: {
            $ne: null,
          },
          longitude: {
            $ne: null,
          },
        }),
      ]);

    const [countries, regions, cities, mapPoints, recentLocations] =
      await Promise.all([
        getBreakdown("country", currentUser.id, 10),
        getBreakdown("region", currentUser.id, 10),
        getBreakdown("city", currentUser.id, 10),

        Click.aggregate([
          {
            $match: {
              userId: currentUser.id,
              latitude: {
                $ne: null,
              },
              longitude: {
                $ne: null,
              },
            },
          },
          {
            $group: {
              _id: {
                latitude: "$latitude",
                longitude: "$longitude",
                country: "$country",
                region: "$region",
                city: "$city",
              },
              clicks: {
                $sum: 1,
              },
              lastClickedAt: {
                $max: "$clickedAt",
              },
            },
          },
          {
            $sort: {
              clicks: -1,
            },
          },
          {
            $limit: 100,
          },
          {
            $project: {
              _id: 0,
              latitude: "$_id.latitude",
              longitude: "$_id.longitude",
              country: "$_id.country",
              region: "$_id.region",
              city: "$_id.city",
              clicks: 1,
              lastClickedAt: 1,
            },
          },
        ]),

        Click.find({
          userId: currentUser.id,
        })
          .sort({ clickedAt: -1 })
          .limit(20)
          .select(
            "clickedAt country region city latitude longitude timezone deviceType browser os refererDomain"
          )
          .lean(),
      ]);

    const geoUnavailable =
      totalClicks > 0 && knownCountryClicks === 0 && knownCoordinateClicks === 0;

    return Response.json({
      success: true,
      data: {
        totalClicks,
        knownCountryClicks,
        knownCoordinateClicks,
        geoUnavailable,

        countries,
        regions,
        cities,

        mapPoints,

        recentLocations: recentLocations.map((click: any) => ({
          id: click._id.toString(),
          clickedAt: click.clickedAt,
          country: click.country || "Unknown",
          region: click.region || "Unknown",
          city: click.city || "Unknown",
          latitude: click.latitude ?? null,
          longitude: click.longitude ?? null,
          timezone: click.timezone || "Unknown",
          deviceType: click.deviceType || "Unknown",
          browser: click.browser || "Unknown",
          os: click.os || "Unknown",
          refererDomain: click.refererDomain || "Direct",
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