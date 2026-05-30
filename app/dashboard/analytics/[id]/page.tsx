"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Bot,
  Globe2,
  Loader2,
  Monitor,
  MousePointerClick,
  Users,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type BreakdownItem = {
  name: string;
  count: number;
};

type RecentClick = {
  id: string;
  clickedAt: string;
  refererDomain: string;
  country: string;
  region: string;
  city: string;
  deviceType: string;
  browser: string;
  os: string;
  language: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  isBot: boolean;
};

type AnalyticsData = {
  link: {
    id: string;
    originalUrl: string;
    shortUrl: string;
    linkType: "short" | "custom";
    status: string;
    totalClicks: number;
    createdAt: string;
    expiresAt: string | null;
    lastClickedAt: string | null;
  };
  summary: {
    totalClicks: number;
    uniqueVisitors: number;
    sessions: number;
    botClicks: number;
    humanClicks: number;
  };
  clicksOverTime: {
    date: string;
    count: number;
  }[];
  breakdowns: {
    devices: BreakdownItem[];
    browsers: BreakdownItem[];
    os: BreakdownItem[];
    countries: BreakdownItem[];
    regions: BreakdownItem[];
    cities: BreakdownItem[];
    referrers: BreakdownItem[];
    utmSources: BreakdownItem[];
  };
  recentClicks: RecentClick[];
};

type AnalyticsResponse = {
  success: boolean;
  message?: string;
  data?: AnalyticsData;
};

function formatDate(date: string | null) {
  if (!date) return "Never";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function BreakdownCard({
  title,
  items,
}: {
  title: string;
  items: BreakdownItem[];
}) {
  const maxCount = Math.max(...items.map((item) => item.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet</p>
        ) : (
          <div className="space-y-3">
            {items.slice(0, 6).map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-sm">
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

export default function LinkAnalyticsPage() {
  const params = useParams<{ id: string }>();

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch(`/api/links/${params.id}/analytics`);
        const data: AnalyticsResponse = await response.json();

        if (!response.ok) {
          toast.error(data.message || "Failed to load analytics");
          return;
        }

        setAnalytics(data.data || null);
      } catch {
        toast.error("Something went wrong");
      } finally {
        setIsLoading(false);
      }
    }

    if (params.id) {
      fetchAnalytics();
    }
  }, [params.id]);

  const geoUnavailable = useMemo(() => {
    if (!analytics) return false;

    return analytics.breakdowns.countries.every(
      (item) => item.name === "Unknown"
    );
  }, [analytics]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading analytics...
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="rounded-lg border border-dashed py-20 text-center">
        <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">Analytics not found</h2>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard/analytics">
          <Button variant="ghost" className="mb-4 px-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to analytics
          </Button>
        </Link>

        <h1 className="text-3xl font-bold tracking-tight">Link Analytics</h1>
        <p className="mt-2 truncate font-mono text-sm text-indigo-500">
          {analytics.link.shortUrl}
        </p>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {analytics.link.originalUrl}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="space-y-0">
            <CardTitle className="text-sm text-muted-foreground">
              Total Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MousePointerClick className="h-5 w-5 text-indigo-500" />
              <p className="text-3xl font-bold">
                {analytics.summary.totalClicks}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0">
            <CardTitle className="text-sm text-muted-foreground">
              Visitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              <p className="text-3xl font-bold">
                {analytics.summary.uniqueVisitors}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0">
            <CardTitle className="text-sm text-muted-foreground">
              Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.summary.sessions}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0">
            <CardTitle className="text-sm text-muted-foreground">
              Human Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {analytics.summary.humanClicks}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0">
            <CardTitle className="text-sm text-muted-foreground">
              Bot Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-indigo-500" />
              <p className="text-3xl font-bold">
                {analytics.summary.botClicks}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clicks Over Time</CardTitle>
        </CardHeader>

        <CardContent>
          {analytics.clicksOverTime.length === 0 ? (
            <p className="text-sm text-muted-foreground">No clicks yet</p>
          ) : (
            <div className="space-y-3">
              {analytics.clicksOverTime.map((item) => (
                <div key={item.date} className="flex items-center gap-3">
                  <span className="w-28 text-sm text-muted-foreground">
                    {item.date}
                  </span>
                  <div className="h-3 flex-1 rounded-full bg-muted">
                    <div
                      className="h-3 rounded-full bg-indigo-600"
                      style={{
                        width: `${
                          (item.count /
                            Math.max(
                              ...analytics.clicksOverTime.map(
                                (entry) => entry.count
                              )
                            )) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm font-medium">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {geoUnavailable && (
        <Card>
          <CardContent className="flex items-start gap-3 p-5">
            <Globe2 className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Geo data unavailable locally</p>
              <p className="text-sm text-muted-foreground">
                Country, region, and city may stay Unknown during local
                development. Deployment provider headers or an IP geolocation
                service can populate this later.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <BreakdownCard title="Devices" items={analytics.breakdowns.devices} />
        <BreakdownCard title="Browsers" items={analytics.breakdowns.browsers} />
        <BreakdownCard title="Operating Systems" items={analytics.breakdowns.os} />
        <BreakdownCard title="Countries" items={analytics.breakdowns.countries} />
        <BreakdownCard title="Referrers" items={analytics.breakdowns.referrers} />
        <BreakdownCard title="UTM Sources" items={analytics.breakdowns.utmSources} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Clicks</CardTitle>
        </CardHeader>

        <CardContent>
          {analytics.recentClicks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent clicks</p>
          ) : (
            <div className="space-y-3">
              {analytics.recentClicks.map((click) => (
                <div
                  key={click.id}
                  className="rounded-lg border bg-card p-4 text-sm"
                >
                  <div className="flex flex-col justify-between gap-2 md:flex-row">
                    <div>
                      <p className="font-medium">
                        {click.browser} on {click.os}
                      </p>
                      <p className="text-muted-foreground">
                        {click.deviceType} · {click.language}
                      </p>
                    </div>

                    <p className="text-muted-foreground">
                      {formatDate(click.clickedAt)}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Referrer: {click.refererDomain}</span>
                    <span>
                      Location: {click.city}, {click.region}, {click.country}
                    </span>
                    <span>Bot: {click.isBot ? "Yes" : "No"}</span>
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