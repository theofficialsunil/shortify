"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Bot,
  Calendar,
  Copy,
  ExternalLink,
  Globe2,
  Loader2,
  MousePointerClick,
  Smartphone,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type RangeOption = "7d" | "30d" | "90d" | "all";

type BreakdownItem = {
  label: string;
  clicks: number;
  percentage: number;
};

type AnalyticsData = {
  range: RangeOption;
  dateFrom: string | null;
  dateTo: string;

  link: {
    id: string;
    originalUrl: string;
    shortCode: string | null;
    customAlias: string | null;
    username: string | null;
    linkType: "short" | "custom";
    shortUrl: string;
    description: string;
    expiresAt: string | null;
    status: "active" | "disabled";
    totalClicks: number;
    passwordProtected: boolean;
    createdAt: string;
  };

  summary: {
    totalClicks: number;
    uniqueVisitors: number;
    uniqueSessions: number;
    humanClicks: number;
    botClicks: number;
  };

  clicksOverTime: {
    date: string;
    clicks: number;
  }[];

  breakdowns: {
    devices: BreakdownItem[];
    browsers: BreakdownItem[];
    operatingSystems: BreakdownItem[];
    countries: BreakdownItem[];
    regions: BreakdownItem[];
    cities: BreakdownItem[];
    referrers: BreakdownItem[];
    utmSources: BreakdownItem[];
    utmMediums: BreakdownItem[];
    utmCampaigns: BreakdownItem[];
  };

  recentClicks: {
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
  }[];
};

type AnalyticsResponse = {
  success: boolean;
  message?: string;
  data?: AnalyticsData;
};

const rangeOptions: {
  label: string;
  value: RangeOption;
}[] = [
  {
    label: "Last 7 days",
    value: "7d",
  },
  {
    label: "Last 30 days",
    value: "30d",
  },
  {
    label: "Last 90 days",
    value: "90d",
  },
  {
    label: "All time",
    value: "all",
  },
];

export default function LinkAnalyticsPage() {
  const params = useParams<{ id: string }>();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [selectedRange, setSelectedRange] = useState<RangeOption>("30d");
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, selectedRange]);

  async function fetchAnalytics() {
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/links/${params.id}/analytics?range=${selectedRange}`
      );

      const result: AnalyticsResponse = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Failed to load analytics");
        return;
      }

      setData(result.data || null);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (!data?.link.shortUrl) return;

    await navigator.clipboard.writeText(data.link.shortUrl);
    setCopied(true);
    toast.success("Copied to clipboard");

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  function formatDate(value: string | null) {
    if (!value) return "All time";
    return new Date(value).toLocaleDateString();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="space-y-2">
          <Button asChild variant="ghost" className="-ml-4">
            <Link href="/dashboard/analytics">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Analytics
            </Link>
          </Button>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Link Analytics
            </h1>
            <p className="mt-2 text-muted-foreground">
              Analyze clicks, visitors, devices, locations, and referrers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />

          <select
            value={selectedRange}
            onChange={(event) =>
              setSelectedRange(event.target.value as RangeOption)
            }
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            {rangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading analytics...
          </CardContent>
        </Card>
      ) : !data ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Analytics not found.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div className="min-w-0 space-y-2">
                  <CardTitle className="break-all text-lg">
                    {data.link.shortUrl}
                  </CardTitle>

                  <CardDescription className="break-all">
                    {data.link.originalUrl}
                  </CardDescription>

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>Range: {formatDate(data.dateFrom)} → Now</span>
                    <span>Status: {data.link.status}</span>
                    <span>Type: {data.link.linkType}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={handleCopy}>
                    <Copy className="mr-2 h-4 w-4" />
                    {copied ? "Copied" : "Copy"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.open(data.link.shortUrl, "_blank")}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard
              title="Total Clicks"
              value={data.summary.totalClicks}
              icon={<MousePointerClick className="h-5 w-5" />}
            />

            <StatCard
              title="Visitors"
              value={data.summary.uniqueVisitors}
              icon={<Users className="h-5 w-5" />}
            />

            <StatCard
              title="Sessions"
              value={data.summary.uniqueSessions}
              icon={<BarChart3 className="h-5 w-5" />}
            />

            <StatCard
              title="Human Clicks"
              value={data.summary.humanClicks}
              icon={<Users className="h-5 w-5" />}
            />

            <StatCard
              title="Bot Clicks"
              value={data.summary.botClicks}
              icon={<Bot className="h-5 w-5" />}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Clicks Over Time</CardTitle>
              <CardDescription>
                Daily clicks for the selected date range.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {data.clicksOverTime.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No clicks in this date range.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.clicksOverTime.map((item) => (
                    <BarRow
                      key={item.date}
                      label={item.date}
                      value={item.clicks}
                      max={Math.max(
                        ...data.clicksOverTime.map((row) => row.clicks)
                      )}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <BreakdownCard
              title="Devices"
              icon={<Smartphone className="h-5 w-5" />}
              items={data.breakdowns.devices}
            />

            <BreakdownCard
              title="Browsers"
              icon={<BarChart3 className="h-5 w-5" />}
              items={data.breakdowns.browsers}
            />

            <BreakdownCard
              title="Operating Systems"
              icon={<BarChart3 className="h-5 w-5" />}
              items={data.breakdowns.operatingSystems}
            />

            <BreakdownCard
              title="Countries"
              icon={<Globe2 className="h-5 w-5" />}
              items={data.breakdowns.countries}
            />

            <BreakdownCard
              title="Referrers"
              icon={<ExternalLink className="h-5 w-5" />}
              items={data.breakdowns.referrers}
            />

            <BreakdownCard
              title="UTM Sources"
              icon={<BarChart3 className="h-5 w-5" />}
              items={data.breakdowns.utmSources}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Clicks</CardTitle>
              <CardDescription>
                Latest click events for the selected range.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {data.recentClicks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No recent clicks in this range.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.recentClicks.map((click) => (
                    <div
                      key={click.id}
                      className="rounded-lg border p-4 text-sm"
                    >
                      <div className="flex flex-col justify-between gap-2 md:flex-row">
                        <div>
                          <p className="font-medium">
                            {click.country || "Unknown"} /{" "}
                            {click.deviceType || "Unknown"}
                          </p>

                          <p className="text-muted-foreground">
                            {click.browser || "Unknown"} on{" "}
                            {click.os || "Unknown"}
                          </p>
                        </div>

                        <div className="text-muted-foreground md:text-right">
                          <p>{new Date(click.clickedAt).toLocaleString()}</p>
                          <p>{click.isBot ? "Bot" : "Human"}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>Referrer: {click.refererDomain || "Direct"}</span>
                        <span>City: {click.city || "Unknown"}</span>
                        <span>Region: {click.region || "Unknown"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function BreakdownCard({
  title,
  icon,
  items,
}: {
  title: string;
  icon: ReactNode;
  items: BreakdownItem[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <span className="mr-2 text-muted-foreground">{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data available.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <BarRow
                key={item.label}
                label={item.label}
                value={item.clicks}
                max={Math.max(...items.map((row) => row.clicks))}
                suffix={`${item.percentage}%`}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BarRow({
  label,
  value,
  max,
  suffix,
}: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
}) {
  const width = max > 0 ? `${Math.max((value / max) * 100, 4)}%` : "0%";

  return (
    <div className="space-y-1">
      <div className="flex justify-between gap-3 text-sm">
        <span className="truncate">{label}</span>
        <span className="whitespace-nowrap text-muted-foreground">
          {value}
          {suffix ? ` · ${suffix}` : ""}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-indigo-600" style={{ width }} />
      </div>
    </div>
  );
}