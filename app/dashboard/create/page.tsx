"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Link2,
  Loader2,
  Lock,
  QrCode,
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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type FormData = {
  longUrl: string;
  customAlias: string;
  description: string;
  expiration: "never" | "1hour" | "1day" | "7days" | "30days";
  password: string;
};

type FormErrors = {
  longUrl?: string;
  customAlias?: string;
  password?: string;
};

type CreateLinkResponse = {
  success: boolean;
  message?: string;
  errors?: {
    field: string;
    message: string;
  }[];
  data?: {
    id: string;
    originalUrl: string;
    shortCode: string | null;
    customAlias: string | null;
    username: string | null;
    linkType: "short" | "custom";
    shortUrl: string;
    description: string;
    expiresAt: string | null;
    status: string;
    totalClicks: number;
    createdAt: string;
  };
};

export default function CreateLinkPage() {
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState<FormData>({
    longUrl: "",
    customAlias: "",
    description: "",
    expiration: "never",
    password: "",
  });

  const [passwordProtected, setPasswordProtected] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [shortUrl, setShortUrl] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [createdLinkType, setCreatedLinkType] = useState<
    "short" | "custom" | ""
  >("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const url = searchParams.get("url");
    const alias = searchParams.get("alias");

    if (url || alias) {
      setFormData((prev) => ({
        ...prev,
        longUrl: url || prev.longUrl,
        customAlias: alias || prev.customAlias,
      }));
    }
  }, [searchParams]);

  function handleChange(field: keyof FormData, value: string) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
  }

  function validateForm() {
    const nextErrors: FormErrors = {};

    if (!formData.longUrl.trim()) {
      nextErrors.longUrl = "Long URL is required";
    } else {
      try {
        const parsedUrl = new URL(formData.longUrl);

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          nextErrors.longUrl = "Only HTTP and HTTPS URLs are allowed";
        }
      } catch {
        nextErrors.longUrl = "Enter a valid URL";
      }
    }

    if (formData.customAlias.trim()) {
      const aliasRegex = /^[a-zA-Z0-9-_]+$/;

      if (formData.customAlias.trim().length < 3) {
        nextErrors.customAlias = "Alias must be at least 3 characters";
      } else if (!aliasRegex.test(formData.customAlias.trim())) {
        nextErrors.customAlias =
          "Alias can only contain letters, numbers, hyphens, and underscores";
      }
    }

    if (passwordProtected && formData.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setShortUrl("");
    setQrCodeUrl("");
    setCreatedLinkType("");

    try {
      const response = await fetch("/api/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalUrl: formData.longUrl,
          customAlias: formData.customAlias,
          description: formData.description,
          expiration: formData.expiration,
          passwordProtected,
          password: passwordProtected ? formData.password : "",
        }),
      });

      const data: CreateLinkResponse = await response.json();

      if (!response.ok) {
        if (data.errors) {
          const apiErrors: FormErrors = {};

          data.errors.forEach((error) => {
            if (error.field === "originalUrl") {
              apiErrors.longUrl = error.message;
            }

            if (error.field === "customAlias") {
              apiErrors.customAlias = error.message;
            }

            if (error.field === "password") {
              apiErrors.password = error.message;
            }
          });

          setErrors(apiErrors);
        }

        toast.error(data.message || "Failed to create link");
        return;
      }

      if (!data.data?.shortUrl) {
        toast.error("Short URL missing from server response");
        return;
      }

      const qrDataUrl = await QRCode.toDataURL(data.data.shortUrl, {
        width: 300,
        margin: 2,
      });

      setShortUrl(data.data.shortUrl);
      setQrCodeUrl(qrDataUrl);
      setCreatedLinkType(data.data.linkType);

      toast.success("Short link created successfully");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (!shortUrl) return;

    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    toast.success("Copied to clipboard");

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  function handleDownloadQr() {
    if (!qrCodeUrl) return;

    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = "shortify-qr-code.png";
    link.click();
  }

  function resetForm() {
    setFormData({
      longUrl: "",
      customAlias: "",
      description: "",
      expiration: "never",
      password: "",
    });

    setPasswordProtected(false);
    setErrors({});
    setShortUrl("");
    setQrCodeUrl("");
    setCreatedLinkType("");
    setCopied(false);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Link</h1>
        <p className="mt-2 text-muted-foreground">
          Create a short URL with optional custom alias, expiration, and
          password.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shorten a URL</CardTitle>
          <CardDescription>
            Paste a long URL and generate a trackable short link.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="longUrl">Long URL</FieldLabel>
                <Input
                  id="longUrl"
                  type="url"
                  placeholder="https://example.com/very-long-url"
                  value={formData.longUrl}
                  onChange={(event) =>
                    handleChange("longUrl", event.target.value)
                  }
                />
                {errors.longUrl && (
                  <p className="text-sm text-destructive">{errors.longUrl}</p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="customAlias">Custom Alias</FieldLabel>

                <div className="flex items-center gap-2">
                  <span className="whitespace-nowrap rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
                    /s/username/
                  </span>

                  <Input
                    id="customAlias"
                    placeholder="my-github"
                    value={formData.customAlias}
                    onChange={(event) =>
                      handleChange("customAlias", event.target.value)
                    }
                  />
                </div>

                <FieldDescription>
                  Leave empty to generate a random short link like /s/a8xPq2z.
                </FieldDescription>

                {errors.customAlias && (
                  <p className="text-sm text-destructive">
                    {errors.customAlias}
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea
                  id="description"
                  placeholder="Optional note for this link"
                  value={formData.description}
                  onChange={(event) =>
                    handleChange("description", event.target.value)
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="expiration">Expiration</FieldLabel>

                <select
                  id="expiration"
                  value={formData.expiration}
                  onChange={(event) =>
                    handleChange("expiration", event.target.value)
                  }
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="never">Never</option>
                  <option value="1hour">1 hour</option>
                  <option value="1day">1 day</option>
                  <option value="7days">7 days</option>
                  <option value="30days">30 days</option>
                </select>
              </Field>

              <Field>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <FieldLabel>Password Protection</FieldLabel>
                    <FieldDescription>
                      Require a password before redirecting visitors.
                    </FieldDescription>
                  </div>

                  <Switch
                    checked={passwordProtected}
                    onCheckedChange={setPasswordProtected}
                  />
                </div>
              </Field>

              {passwordProtected && (
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Minimum 6 characters"
                      className="pl-10"
                      value={formData.password}
                      onChange={(event) =>
                        handleChange("password", event.target.value)
                      }
                    />
                  </div>

                  {errors.password && (
                    <p className="text-sm text-destructive">
                      {errors.password}
                    </p>
                  )}
                </Field>
              )}
            </FieldGroup>

            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Link2 className="mr-2 h-4 w-4" />
                    Create Short Link
                  </>
                )}
              </Button>

              <Button type="button" variant="outline" onClick={resetForm}>
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {shortUrl && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle2 className="h-5 w-5" />
              <CardTitle className="text-lg">Short link created</CardTitle>
            </div>

            <CardDescription>
              {createdLinkType === "custom"
                ? "This is your user-scoped custom alias."
                : "This is your random generated short link."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="flex gap-2">
              <Input value={shortUrl} readOnly className="font-mono" />

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopy}
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => window.open(shortUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-col items-center justify-center rounded-lg border bg-muted p-6">
              {qrCodeUrl ? (
                <>
                  <img
                    src={qrCodeUrl}
                    alt="QR code for short link"
                    className="h-40 w-40 rounded-lg bg-white p-2"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={handleDownloadQr}
                  >
                    Download QR Code
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-background">
                    <QrCode className="h-14 w-14 text-muted-foreground" />
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground">
                    QR code will appear here.
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}