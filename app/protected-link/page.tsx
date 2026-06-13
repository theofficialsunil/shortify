"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link2, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type VerifyPasswordResponse = {
  success: boolean;
  message?: string;
  data?: {
    originalUrl: string;
  };
};

export default function ProtectedLinkPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
          <div className="flex items-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading protected link...
          </div>
        </main>
      }
    >
      <ProtectedLinkForm />
    </Suspense>
  );
}

function ProtectedLinkForm() {
  const searchParams = useSearchParams();

  const linkId = searchParams.get("linkId");

  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function getVerifyPasswordErrorMessage(data: VerifyPasswordResponse) {
    if (data.message) return data.message;
    return "Failed to verify password";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPasswordError("");

    if (!linkId) {
      toast.error("Invalid protected link");
      return;
    }

    if (!password.trim()) {
      setPasswordError("Password is required");
      toast.error("Password is required");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/links/verify-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          linkId,
          password,
        }),
      });

      const data: VerifyPasswordResponse = await response.json();

      if (!response.ok) {
        const message = getVerifyPasswordErrorMessage(data);

        if (
          response.status === 401 ||
          response.status === 400 ||
          response.status === 429
        ) {
          setPasswordError(message);
        }

        toast.error(message);
        return;
      }

      if (!data.data?.originalUrl) {
        toast.error("Destination URL missing");
        return;
      }

      toast.success("Password verified");
      window.location.href = data.data.originalUrl;
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12 text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600">
            <Lock className="h-6 w-6 text-white" />
          </div>

          <CardTitle className="text-2xl">Password protected link</CardTitle>
          <CardDescription>
            Enter the password provided by the link owner to continue.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!linkId ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Invalid protected link.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter link password"
                    className="pl-10"
                    value={password}
                    disabled={isLoading}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setPasswordError("");
                    }}
                  />
                </div>

                {passwordError && (
                  <p className="text-sm text-destructive">{passwordError}</p>
                )}

                <FieldDescription>
                  Passwords cannot be recovered. Ask the link owner if you do
                  not know it.
                </FieldDescription>
              </Field>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Link2 className="mr-2 h-4 w-4" />
                    Continue
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}