"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Ban,
  Clock,
  Home,
  Link2,
  SearchX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type StatusContent = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

const statusMap: Record<string, StatusContent> = {
  "not-found": {
    title: "Short link not found",
    description:
      "The link you opened does not exist or may have been deleted by the owner.",
    icon: <SearchX className="h-7 w-7 text-white" />,
  },

  expired: {
    title: "This link has expired",
    description:
      "The owner set an expiration time for this short link, and it is no longer active.",
    icon: <Clock className="h-7 w-7 text-white" />,
  },

  disabled: {
    title: "This link is disabled",
    description:
      "The owner has temporarily disabled this short link. It may become available again later.",
    icon: <Ban className="h-7 w-7 text-white" />,
  },

  invalid: {
    title: "Invalid short link",
    description:
      "This URL does not match a valid Shortify short-link format.",
    icon: <AlertTriangle className="h-7 w-7 text-white" />,
  },

  error: {
    title: "Something went wrong",
    description:
      "Shortify could not process this link right now. Try again later.",
    icon: <AlertTriangle className="h-7 w-7 text-white" />,
  },
};

export default function LinkStatusPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
          <p className="text-muted-foreground">Loading link status...</p>
        </main>
      }
    >
      <LinkStatusContent />
    </Suspense>
  );
}

function LinkStatusContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") || "not-found";

  const status = statusMap[reason] || statusMap["not-found"];

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12 text-foreground">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600">
            {status.icon}
          </div>

          <CardTitle className="text-2xl">{status.title}</CardTitle>
          <CardDescription>{status.description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go to Home
            </Link>
          </Button>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Link2 className="h-4 w-4" />
            Shortify
          </div>
        </CardContent>
      </Card>
    </main>
  );
}