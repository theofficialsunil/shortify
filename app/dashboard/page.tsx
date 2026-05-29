"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  CalendarClock,
  Copy,
  ExternalLink,
  Link2,
  Loader2,
  MousePointerClick,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type LinkItem = {
  id: string;
  originalUrl: string;
  shortCode: string | null;
  customAlias: string | null;
  username: string | null;
  linkType: "short" | "custom";
  shortUrl: string;
  description: string;
  expiresAt: string | null;
  status: "active" | "disabled" | "expired";
  totalClicks: number;
  lastClickedAt: string | null;
  createdAt: string;
};

type LinksResponse = {
  success: boolean;
  message?: string;
  data?: LinkItem[];
};

export default function DashboardPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLinks() {
      try {
        const response = await fetch("/api/links");
        const data: LinksResponse = await response.json();

        if (!response.ok) {
          toast.error(data.message || "Failed to load links");
          return;
        }

        setLinks(data.data || []);
      } catch {
        toast.error("Something went wrong");
      } finally {
        setIsLoading(false);
      }
    }

    fetchLinks();
  }, []);

  const stats = useMemo(() => {
    const totalLinks = links.length;

    const activeLinks = links.filter((link) => link.status === "active").length;

    const expiredLinks = links.filter(
      (link) => link.status === "expired"
    ).length;

    const totalClicks = links.reduce((sum, link) => {
      return sum + link.totalClicks;
    }, 0);

    return {
      totalLinks,
      activeLinks,
      expiredLinks,
      totalClicks,
    };
  }, [links]);

  async function handleCopy(shortUrl: string) {
    await navigator.clipboard.writeText(shortUrl);
    toast.success("Copied to clipboard");
  }

  function formatDate(date: string | null) {
    if (!date) return "Never";

    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  }

  function getStatusLabel(status: LinkItem["status"]) {
    if (status === "active") return "Active";
    if (status === "expired") return "Expired";
    return "Disabled";
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Track your short links, clicks, and recent activity.
          </p>
        </div>

        <Link href="/dashboard/create">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Link
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Links
            </CardTitle>
            <Link2 className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalLinks}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Links
            </CardTitle>
            <BarChart3 className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.activeLinks}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expired Links
            </CardTitle>
            <CalendarClock className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.expiredLinks}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Clicks
            </CardTitle>
            <MousePointerClick className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalClicks}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Links</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading links...
            </div>
          ) : links.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <Link2 className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No links yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first short link to see it here.
              </p>

              <Link href="/dashboard/create" className="mt-4 inline-block">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  Create Link
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {links.slice(0, 5).map((link) => (
                <div
                  key={link.id}
                  className="rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-500">
                          {link.linkType === "custom" ? "Custom" : "Random"}
                        </span>

                        <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
                          {getStatusLabel(link.status)}
                        </span>
                      </div>

                      <p className="truncate font-mono text-sm text-indigo-500">
                        {link.shortUrl}
                      </p>

                      <p className="truncate text-sm text-muted-foreground">
                        {link.originalUrl}
                      </p>

                      {link.description && (
                        <p className="text-sm">{link.description}</p>
                      )}

                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span>Clicks: {link.totalClicks}</span>
                        <span>Created: {formatDate(link.createdAt)}</span>
                        <span>Expires: {formatDate(link.expiresAt)}</span>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopy(link.shortUrl)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(link.shortUrl, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
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