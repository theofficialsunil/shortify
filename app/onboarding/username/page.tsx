"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2 } from "lucide-react";
import { useSession } from "next-auth/react";
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

export default function UsernameOnboardingPage() {
  const router = useRouter();
  const { data: session, update } = useSession();

  const [username, setUsername] = useState(session?.user.username || "");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);

    try {
      const response = await fetch("/api/user/username", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to update username");
        return;
      }

      await update({
        user: {
          username: data.data.username,
          usernameSetupCompleted: true,
        },
      });

      toast.success("Username saved");
      router.push("/dashboard");
      router.refresh();
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
            <Link2 className="h-6 w-6 text-white" />
          </div>

          <CardTitle className="text-2xl">Choose your username</CardTitle>
          <CardDescription>
            Your username will be used in custom short links.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <FieldLabel htmlFor="username">Username</FieldLabel>

              <Input
                id="username"
                placeholder="nagar"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />

              <FieldDescription>
                Your custom links will look like:
              </FieldDescription>

              <div className="rounded-lg border bg-muted px-3 py-2 font-mono text-sm">
                shortify.app/s/{username || "username"}/my-link
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? "Saving..." : "Continue to Dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}