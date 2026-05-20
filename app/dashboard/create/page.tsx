"use client";

import { useState } from "react";
import { AlertCircle, Link2, Lock } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type FormData = {
  longUrl: string;
  customAlias: string;
  description: string;
  expiration: string;
  password: string;
};

type FormErrors = {
  longUrl?: string;
  customAlias?: string;
  password?: string;
};

export default function CreateLinkPage() {
  const [formData, setFormData] = useState<FormData>({
    longUrl: "",
    customAlias: "",
    description: "",
    expiration: "never",
    password: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function validateUrl(url: string) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  function handleChange(field: keyof FormData, value: string) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};

    if (!formData.longUrl) {
      nextErrors.longUrl = "URL is required";
    } else if (!validateUrl(formData.longUrl)) {
      nextErrors.longUrl = "Enter a valid URL";
    }

    if (formData.customAlias && formData.customAlias.length < 3) {
      nextErrors.customAlias = "Alias must be at least 3 characters";
    }

    if (passwordProtected) {
      if (!formData.password) {
        nextErrors.password = "Password is required";
      } else if (formData.password.length < 6) {
        nextErrors.password = "Password must be at least 6 characters";
      }
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create New Link</h1>
        <p className="mt-1 text-muted-foreground">
          Shorten a long URL with custom options.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-indigo-500" />
            Link Details
          </CardTitle>
          <CardDescription>
            Fill in the details below to create your short link.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="longUrl">
                  Long URL <span className="text-red-500">*</span>
                </FieldLabel>

                <Input
                  id="longUrl"
                  type="url"
                  placeholder="https://example.com/very-long-url"
                  value={formData.longUrl}
                  onChange={(event) =>
                    handleChange("longUrl", event.target.value)
                  }
                />

                {errors.longUrl ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.longUrl}</AlertDescription>
                  </Alert>
                ) : (
                  <FieldDescription>
                    Paste the original URL you want to shorten.
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="customAlias">
                  Custom Alias
                </FieldLabel>

                <div className="flex items-center gap-2">
                  <span className="whitespace-nowrap text-sm text-muted-foreground">
                    shortify.app/
                  </span>

                  <Input
                    id="customAlias"
                    placeholder="resume"
                    value={formData.customAlias}
                    onChange={(event) =>
                      handleChange("customAlias", event.target.value)
                    }
                  />
                </div>

                {errors.customAlias ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.customAlias}</AlertDescription>
                  </Alert>
                ) : (
                  <FieldDescription>
                    Leave empty to generate a random short code.
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="expiration">Expiration</FieldLabel>

                <NativeSelect
                  id="expiration"
                  value={formData.expiration}
                  onChange={(event) =>
                    handleChange("expiration", event.target.value)
                  }
                >
                  <NativeSelectOption value="never">Never</NativeSelectOption>
                  <NativeSelectOption value="1hour">1 Hour</NativeSelectOption>
                  <NativeSelectOption value="1day">1 Day</NativeSelectOption>
                  <NativeSelectOption value="7days">7 Days</NativeSelectOption>
                  <NativeSelectOption value="30days">
                    30 Days
                  </NativeSelectOption>
                </NativeSelect>

                <FieldDescription>
                  Choose when this link should stop working.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="description">Description</FieldLabel>

                <Textarea
                  id="description"
                  placeholder="Add a note for this link..."
                  value={formData.description}
                  onChange={(event) =>
                    handleChange("description", event.target.value)
                  }
                  rows={3}
                />

                <FieldDescription>
                  Optional note to help you identify this link later.
                </FieldDescription>
              </Field>
            </FieldGroup>

            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label
                    htmlFor="password-protection"
                    className="flex items-center gap-2"
                  >
                    <Lock className="h-4 w-4 text-indigo-500" />
                    Password Protection
                  </Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Require a password before redirecting visitors.
                  </p>
                </div>

                <Switch
                  id="password-protection"
                  checked={passwordProtected}
                  onCheckedChange={setPasswordProtected}
                />
              </div>

              {passwordProtected && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="password">
                    Password <span className="text-red-500">*</span>
                  </Label>

                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(event) =>
                      handleChange("password", event.target.value)
                    }
                  />

                  {errors.password && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.password}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <Button type="button" variant="outline" className="flex-1">
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? "Creating..." : "Create Short Link"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}