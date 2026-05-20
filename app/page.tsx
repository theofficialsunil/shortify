"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Copy,
  ExternalLink,
  Link2,
  Moon,
  QrCode,
  ShieldCheck,
  Sparkles,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function HomePage() {
  const [longUrl, setLongUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copied, setCopied] = useState(false);

  const { theme, setTheme } = useTheme();

  function handleShorten() {
    if (!longUrl) return;

    try {
      new URL(longUrl);
    } catch {
      return;
    }

    const code = customAlias || Math.random().toString(36).substring(2, 8);
    setShortUrl(`http://localhost:3000/${code}`);
  }

  async function handleCopy() {
    if (!shortUrl) return;

    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 text-gray-900 dark:from-black dark:via-neutral-950 dark:to-black dark:text-white">
      <header className="border-b border-black/5 bg-white/70 backdrop-blur dark:border-neutral-800 dark:bg-black/80">
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
              className="hidden text-sm text-gray-600 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white md:block"
            >
              Features
            </Link>

            <Link
              href="/login"
              className="hidden text-sm text-gray-600 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white md:block"
            >
              Login
            </Link>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            <Link href="/dashboard">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                Dashboard
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-20 pt-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-indigo-950">
          <Link2 className="h-8 w-8 text-white" />
        </div>

        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-4 py-2 text-sm text-indigo-700 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:text-indigo-300">
          <Sparkles className="h-4 w-4" />
          Smart URL shortener with analytics
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
          Shorten, manage, and track every link
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600 dark:text-neutral-400">
          Create clean short links, add custom aliases, generate QR codes, and
          track link performance from one dashboard.
        </p>

        <Card className="mx-auto mt-10 max-w-2xl border-0 bg-white text-left shadow-xl dark:border dark:border-neutral-800 dark:bg-neutral-950">
          <CardHeader>
            <CardTitle>Create Short Link</CardTitle>
            <CardDescription>
              Paste your long URL and generate a short link instantly.
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
                onChange={(e) => setLongUrl(e.target.value)}
                className="dark:border-neutral-800 dark:bg-black dark:text-white dark:placeholder:text-neutral-500"
              />
            </div>

            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between dark:hover:bg-neutral-900"
                >
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
                    <span className="whitespace-nowrap text-sm text-gray-500 dark:text-neutral-400">
                      shortify.app/
                    </span>
                    <Input
                      id="customAlias"
                      placeholder="resume"
                      value={customAlias}
                      onChange={(e) => setCustomAlias(e.target.value)}
                      className="dark:border-neutral-800 dark:bg-black dark:text-white dark:placeholder:text-neutral-500"
                    />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-neutral-500">
                    Leave empty to auto-generate a short code.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Button
              onClick={handleShorten}
              className="w-full bg-indigo-600 py-6 text-base hover:bg-indigo-700"
            >
              Shorten URL
            </Button>

            {shortUrl && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-5 dark:border-green-900/40 dark:bg-green-950/20">
                <div className="mb-4 flex items-center gap-2 text-green-800 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Your short link is ready</span>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={shortUrl}
                    readOnly
                    className="font-mono dark:border-neutral-800 dark:bg-black dark:text-white"
                  />

                  <Button variant="outline" size="icon" onClick={handleCopy}>
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(shortUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-5 flex flex-col items-center justify-center rounded-lg border bg-white p-6 dark:border-neutral-800 dark:bg-black">
                  <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-gray-100 dark:bg-neutral-900">
                    <QrCode className="h-14 w-14 text-gray-400 dark:text-neutral-500" />
                  </div>
                  <p className="mt-3 text-sm text-gray-600 dark:text-neutral-400">
                    QR code preview
                  </p>
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
                "Create memorable aliases like shortify.app/resume or shortify.app/portfolio.",
              icon: Link2,
            },
            {
              title: "Analytics Dashboard",
              description:
                "Track clicks, referrers, devices, countries, and recent activity.",
              icon: BarChart3,
            },
            {
              title: "Secure Link Controls",
              description:
                "Add expiration dates, disable links, and protect sensitive URLs.",
              icon: ShieldCheck,
            },
          ].map((feature) => {
            const Icon = feature.icon;

            return (
              <Card
                key={feature.title}
                className="border-0 bg-white shadow-sm dark:border dark:border-neutral-800 dark:bg-neutral-950"
              >
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-neutral-900">
                    <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-neutral-400">
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