"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  BarChart3,
  ChevronDown,
  Link2,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function HomePage() {
  const router = useRouter();

  const [longUrl, setLongUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [urlError, setUrlError] = useState("");

  const { theme, setTheme } = useTheme();
  const { data: session, status } = useSession();

  function handleShorten() {
    setUrlError("");
    setShowLoginPrompt(false);

    if (!longUrl.trim()) {
      setUrlError("Enter a URL first");
      return;
    }

    try {
      new URL(longUrl);
    } catch {
      setUrlError("Enter a valid URL");
      return;
    }

    if (!session) {
      setShowLoginPrompt(true);
      return;
    }

    const params = new URLSearchParams({
      url: longUrl,
    });

    if (customAlias.trim()) {
      params.set("alias", customAlias.trim());
    }

    router.push(`/dashboard/create?${params.toString()}`);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
              <Link2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Shortify</span>
          </Link>

          <nav className="flex items-center gap-3 md:gap-6">
            <Link
              href="#features"
              className="hidden text-sm text-muted-foreground hover:text-foreground md:block"
            >
              Features
            </Link>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {status === "loading" ? (
              <Button size="sm" variant="outline" disabled>
                Loading...
              </Button>
            ) : session ? (
              <>
                <Link href="/dashboard">
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                    Dashboard
                  </Button>
                </Link>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden text-sm text-muted-foreground hover:text-foreground md:block"
                >
                  Login
                </Link>

                <Link href="/signup">
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-20 pt-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600">
          <Link2 className="h-8 w-8 text-white" />
        </div>

        <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm text-indigo-500 shadow-sm">
          <Sparkles className="h-4 w-4" />
          Smart URL shortener with analytics
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
          Shorten, manage, and track every link
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Create clean short links, add custom aliases, generate QR codes, and
          track link performance from one dashboard.
        </p>

        <Card className="mx-auto mt-10 max-w-2xl text-left shadow-xl">
          <CardHeader>
            <CardTitle>Create Short Link</CardTitle>
            <CardDescription>
              Paste your long URL. Login is required to create real short links.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="longUrl">Long URL</Label>
              <Input
                id="longUrl"
                type="url"
                placeholder="https://example.com/very-long-url"
                value={longUrl}
                onChange={(event) => {
                  setLongUrl(event.target.value);
                  setUrlError("");
                  setShowLoginPrompt(false);
                }}
              />
              {urlError && (
                <p className="text-sm text-destructive">{urlError}</p>
              )}
            </div>

            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  Advanced Options
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      showAdvanced ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-3 pt-3">
                <div className="space-y-2">
                  <Label htmlFor="customAlias">Custom Alias</Label>

                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap text-sm text-muted-foreground">
                      /s/username/
                    </span>

                    <Input
                      id="customAlias"
                      placeholder="resume"
                      value={customAlias}
                      onChange={(event) => setCustomAlias(event.target.value)}
                    />
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Login to reserve and create this custom alias.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Button
              onClick={handleShorten}
              className="w-full bg-indigo-600 py-6 text-base hover:bg-indigo-700"
            >
              {session ? "Create in Dashboard" : "Login to Shorten URL"}
            </Button>

            {showLoginPrompt && (
              <div className="rounded-xl border bg-card p-5 text-center">
                <div className="mb-3 flex items-center justify-center gap-2 text-indigo-500">
                  <Link2 className="h-5 w-5" />
                  <span className="font-medium">Login required</span>
                </div>

                <p className="mx-auto max-w-md text-sm text-muted-foreground">
                  Sign in to create real short links, custom aliases, QR codes,
                  and track analytics.
                </p>

                <div className="mt-5 flex justify-center gap-3">
                  <Link href="/login">
                    <Button variant="outline">Login</Button>
                  </Link>

                  <Link href="/signup">
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                      Create Account
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Custom Short Links",
              description:
                "Create memorable aliases like /s/username/resume or /s/username/portfolio.",
              icon: Link2,
            },
            {
              title: "Analytics Dashboard",
              description:
                "Track clicks, referrers, devices, browsers, operating systems, and recent activity.",
              icon: BarChart3,
            },
            {
              title: "Secure Link Controls",
              description:
                "Add expiration dates, disable links, and manage public URLs from your dashboard.",
              icon: ShieldCheck,
            },
          ].map((feature) => {
            const Icon = feature.icon;

            return (
              <Card key={feature.title}>
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10">
                    <Icon className="h-6 w-6 text-indigo-500" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}