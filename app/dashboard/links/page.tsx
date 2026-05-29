"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Copy,
  ExternalLink,
  Link2,
  Loader2,
  PlusCircle,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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

export default function LinksPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    fetchLinks();
  }, []);

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

  const filteredLinks = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) return links;

    return links.filter((link) => {
      return (
        link.shortUrl.toLowerCase().includes(query) ||
        link.originalUrl.toLowerCase().includes(query) ||
        link.description.toLowerCase().includes(query) ||
        link.status.toLowerCase().includes(query)
      );
    });
  }, [links, searchQuery]);

  async function handleCopy(shortUrl: string) {
    await navigator.clipboard.writeText(shortUrl);
    toast.success("Copied to clipboard");
  }

  async function handleStatusToggle(link: LinkItem) {
    if (link.status === "expired") {
      toast.error("Expired links cannot be enabled here");
      return;
    }

    const nextStatus = link.status === "active" ? "disabled" : "active";

    setUpdatingId(link.id);

    try {
      const response = await fetch(`/api/links/${link.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: nextStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to update link");
        return;
      }

      setLinks((prevLinks) =>
        prevLinks.map((item) =>
          item.id === link.id ? { ...item, status: nextStatus } : item
        )
      );

      toast.success(
        nextStatus === "active" ? "Link enabled" : "Link disabled"
      );
    } catch {
      toast.error("Something went wrong");
    } finally {
      setUpdatingId("");
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Delete this link? This action cannot be undone."
    );

    if (!confirmed) return;

    setDeletingId(id);

    try {
      const response = await fetch(`/api/links/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to delete link");
        return;
      }

      setLinks((prevLinks) => prevLinks.filter((link) => link.id !== id));
      toast.success("Link deleted");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeletingId("");
    }
  }

  function formatDate(date: string | null) {
    if (!date) return "Never";

    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  }

  function getStatusClass(status: LinkItem["status"]) {
    if (status === "active") return "text-green-500";
    if (status === "expired") return "text-orange-500";
    return "text-muted-foreground";
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
          <h1 className="text-3xl font-bold tracking-tight">Links</h1>
          <p className="mt-2 text-muted-foreground">
            Manage, search, disable, and delete your short links.
          </p>
        </div>

        <Link href="/dashboard/create">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Link
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Links</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="relative max-w-lg">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search links..."
              className="pl-10"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading links...
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <Link2 className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No links found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create a link or adjust your search query.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLinks.map((link) => (
                <div
                  key={link.id}
                  className="rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-500">
                          {link.linkType === "custom" ? "Custom" : "Random"}
                        </span>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs ${getStatusClass(
                            link.status
                          )}`}
                        >
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
                        <span>
                          Last clicked: {formatDate(link.lastClickedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
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

                      <Button
                        type="button"
                        variant="outline"
                        disabled={
                          updatingId === link.id || link.status === "expired"
                        }
                        onClick={() => handleStatusToggle(link)}
                      >
                        {updatingId === link.id
                          ? "Updating..."
                          : link.status === "active"
                            ? "Disable"
                            : "Enable"}
                      </Button>

                      <Button
                        type="button"
                        variant="destructive"
                        disabled={deletingId === link.id}
                        onClick={() => handleDelete(link.id)}
                      >
                        {deletingId === link.id ? (
                          "Deleting..."
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </>
                        )}
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