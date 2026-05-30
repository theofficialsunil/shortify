"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Globe2,
  Loader2,
  Map,
  MapPin,
  MousePointerClick,
} from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type GeoItem = {
  name: string;
  count: number;
};

type RecentLocation = {
  id: string;
  clickedAt: string;
  country: string;
  region: string;
  city: string;
  deviceType: string;
  browser: string;
  os: string;
  language: string;
  isBot: boolean;
};

type GeoAnalyticsData = {
  totalClicks: number;
  knownCountryClicks: number;
  geoUnavailable: boolean;
  countries: GeoItem[];
  regions: GeoItem[];
  cities: GeoItem[];
  recentLocations: RecentLocation[];
};

type GeoAnalyticsResponse = {
  success: boolean;
  message?: string;
  data?: GeoAnalyticsData;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function GeoBreakdownCard({
  title,
  items,
}: {
  title: string;
  items: GeoItem[];
}) {
  const maxCount = Math.max(...items.map((item) => item.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No geo data yet</p>
        ) : (
          <div className="space-y-4">
            {items.slice(0, 8).map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="truncate">{item.name}</span>
                  <span className="font-medium">{item.count}</span>
                </div>

                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-indigo-600"
                    style={{
                      width: `${(item.count / maxCount) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ClickMapPage() {
  const [data, setData] = useState<GeoAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchGeoAnalytics() {
      try {
        const response = await fetch("/api/analytics/geo");
        const result: GeoAnalyticsResponse = await response.json();

        if (!response.ok) {
          toast.error(result.message || "Failed to load map data");
          return;
        }

        setData(result.data || null);
      } catch {
        toast.error("Something went wrong");
      } finally {
        setIsLoading(false);
      }
    }

    fetchGeoAnalytics();
  }, []);

  const topCountry = useMemo(() => {
    if (!data?.countries.length) return "Unknown";

    const knownCountry = data.countries.find(
      (country) => country.name !== "Unknown"
    );

    return knownCountry?.name || "Unknown";
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading click map...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-dashed py-20 text-center">
        <Map className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">Map data not found</h2>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Click Map</h1>
        <p className="mt-2 text-muted-foreground">
          View where your link clicks are coming from.
        </p>
      </div>

      {data.geoUnavailable && (
        <Card>
          <CardContent className="flex items-start gap-3 p-5">
            <Globe2 className="mt-0.5 h-5 w-5 text-muted-foreground" />

            <div>
              <p className="font-medium">Geo data unavailable locally</p>
              <p className="text-sm text-muted-foreground">
                During local development, country, region, and city usually show
                Unknown. After deployment, provider headers or IP geolocation can
                populate this data.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="space-y-0">
            <CardTitle className="text-sm text-muted-foreground">
              Total Clicks
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex items-center gap-2">
              <MousePointerClick className="h-5 w-5 text-indigo-500" />
              <p className="text-3xl font-bold">{data.totalClicks}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0">
            <CardTitle className="text-sm text-muted-foreground">
              Known Geo Clicks
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-3xl font-bold">{data.knownCountryClicks}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0">
            <CardTitle className="text-sm text-muted-foreground">
              Top Country
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="truncate text-3xl font-bold">{topCountry}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Map Overview</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border bg-muted p-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-background">
              <Map className="h-10 w-10 text-indigo-500" />
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              Geo analytics layer is ready
            </h2>

            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              This MVP page shows country, region, and city click breakdowns.
              A real Google Maps marker view can be added after latitude and
              longitude are captured using IP geolocation.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <GeoBreakdownCard title="Countries" items={data.countries} />
        <GeoBreakdownCard title="Regions" items={data.regions} />
        <GeoBreakdownCard title="Cities" items={data.cities} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Locations</CardTitle>
        </CardHeader>

        <CardContent>
          {data.recentLocations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No clicks yet</p>
          ) : (
            <div className="space-y-3">
              {data.recentLocations.map((location) => (
                <div
                  key={location.id}
                  className="rounded-lg border bg-card p-4 text-sm"
                >
                  <div className="flex flex-col justify-between gap-2 md:flex-row">
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 text-indigo-500" />

                      <div>
                        <p className="font-medium">
                          {location.city}, {location.region},{" "}
                          {location.country}
                        </p>

                        <p className="text-muted-foreground">
                          {location.browser} on {location.os} ·{" "}
                          {location.deviceType} · {location.language}
                        </p>

                        {location.isBot && (
                          <p className="mt-1 text-xs text-orange-500">
                            Bot traffic
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="text-muted-foreground">
                      {formatDate(location.clickedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}