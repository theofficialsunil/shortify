"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AlertTriangle, Loader2, Save, User } from "lucide-react";
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

type FormData = {
  name: string;
  username: string;
};

type FormErrors = {
  name?: string;
  username?: string;
};

type ProfileResponse = {
  success: boolean;
  message?: string;
  errors?: {
    field: string;
    message: string;
  }[];
  data?: {
    id: string;
    name: string;
    email: string;
    username: string;
    usernameSetupCompleted: boolean;
  };
};

export default function SettingsPage() {
  const { data: session, update } = useSession();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    username: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || "",
        username: session.user.username || "",
      });
    }
  }, [session]);

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

    if (formData.name.trim().length < 2) {
      nextErrors.name = "Name must be at least 2 characters";
    }

    if (formData.username.trim().length < 3) {
      nextErrors.username = "Username must be at least 3 characters";
    }

    if (!/^[a-z0-9-_]+$/.test(formData.username.trim().toLowerCase())) {
      nextErrors.username =
        "Username can only contain lowercase letters, numbers, hyphens, and underscores";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
        }),
      });

      const data: ProfileResponse = await response.json();

      if (!response.ok) {
        if (data.errors) {
          const apiErrors: FormErrors = {};

          data.errors.forEach((error) => {
            if (error.field === "name") apiErrors.name = error.message;
            if (error.field === "username") {
              apiErrors.username = error.message;
            }
          });

          setErrors(apiErrors);
        }

        toast.error(data.message || "Failed to update profile");
        return;
      }

      if (!data.data) {
        toast.error("Profile response missing");
        return;
      }

      await update({
        user: {
          name: data.data.name,
          username: data.data.username,
          usernameSetupCompleted: data.data.usernameSetupCompleted,
        },
      });

      toast.success("Profile updated successfully");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your profile and public short-link username.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
              <User className="h-5 w-5 text-indigo-500" />
            </div>

            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Update your name and public username.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input value={session?.user.email || ""} disabled />
              <FieldDescription>
                Email address cannot be changed right now.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                value={formData.name}
                onChange={(event) => handleChange("name", event.target.value)}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <Input
                id="username"
                value={formData.username}
                onChange={(event) =>
                  handleChange("username", event.target.value.toLowerCase())
                }
              />
              <FieldDescription>
                Your custom links use this format:
              </FieldDescription>

              <div className="rounded-lg border bg-muted px-3 py-2 font-mono text-sm">
                shortify.app/s/{formData.username || "username"}/my-link
              </div>

              {errors.username && (
                <p className="text-sm text-destructive">{errors.username}</p>
              )}
            </Field>

            <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />

                <div>
                  <p className="font-medium text-orange-500">
                    Username affects custom links
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your custom short links include your username. Changing it
                    may affect public custom URLs unless username history is
                    added later.
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}