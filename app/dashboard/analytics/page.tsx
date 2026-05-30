"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, ExternalLink, Loader2 } from "lucide-react";
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
  shortUrl: string;
  linkType: "short" | "custom";
  status: "active" | "disabled" | "expired";
  totalClicks: number;
  createdAt: string;
};

type LinksResponse = {
  success: boolean;
  message?: string;
  data?: LinkItem[];
};

export default function AnalyticsOverviewPage() {
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-2 text-muted-foreground">
          Select a link to view detailed analytics.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Choose Link</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading links...
            </div>
          ) : links.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No links yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create links first to view analytics.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="flex flex-col justify-between gap-4 rounded-xl border bg-card p-4 md:flex-row md:items-center"
                >
                  <div className="min-w-0 space-y-2">
                    <p className="truncate font-mono text-sm text-indigo-500">
                      {link.shortUrl}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {link.originalUrl}
                    </p>
                    <p className="text-sm">
                      Clicks:{" "}
                      <span className="font-semibold">{link.totalClicks}</span>
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(link.shortUrl, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>

                    <Link href={`/dashboard/analytics/${link.id}`}>
                      <Button className="bg-indigo-600 hover:bg-indigo-700">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        View Analytics
                      </Button>
                    </Link>
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