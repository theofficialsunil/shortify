"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Copy,
  Edit,
  ExternalLink,
  Loader2,
  Lock,
  Search,
  Trash2,
  Unlock,
  X,
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
import { Textarea } from "@/components/ui/textarea";

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
  status: "active" | "disabled";
  totalClicks: number;
  passwordProtected: boolean;
  createdAt: string;
  updatedAt?: string;
};

type LinksResponse = {
  success: boolean;
  message?: string;
  data?: LinkItem[];
};

type LinkResponse = {
  success: boolean;
  message?: string;
  errors?: {
    field: string;
    message: string;
  }[];
  data?: LinkItem;
};

type EditForm = {
  originalUrl: string;
  description: string;
  status: "active" | "disabled";
  expiration: "keep" | "never" | "1hour" | "1day" | "7days" | "30days";
  passwordAction: "keep" | "change" | "remove";
  password: string;
};

export default function LinksPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState<EditForm>({
    originalUrl: "",
    description: "",
    status: "active",
    expiration: "keep",
    passwordAction: "keep",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiedId, setCopiedId] = useState("");

  const filteredLinks = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return links;

    return links.filter((link) => {
      return (
        link.originalUrl.toLowerCase().includes(query) ||
        link.shortUrl.toLowerCase().includes(query) ||
        link.description.toLowerCase().includes(query)
      );
    });
  }, [links, search]);

  useEffect(() => {
    fetchLinks();
  }, []);

  async function fetchLinks() {
    setIsLoading(true);

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

  function startEditing(link: LinkItem) {
    setEditingId(link.id);

    setEditForm({
      originalUrl: link.originalUrl,
      description: link.description || "",
      status: link.status,
      expiration: "keep",
      passwordAction: "keep",
      password: "",
    });
  }

  function cancelEditing() {
    setEditingId("");
    setEditForm({
      originalUrl: "",
      description: "",
      status: "active",
      expiration: "keep",
      passwordAction: "keep",
      password: "",
    });
  }

  function handleEditChange<K extends keyof EditForm>(
    field: K,
    value: EditForm[K]
  ) {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleUpdate(linkId: string) {
    if (!editForm.originalUrl.trim()) {
      toast.error("Destination URL is required");
      return;
    }

    if (
      editForm.passwordAction === "change" &&
      editForm.password.trim().length < 6
    ) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    setIsUpdating(true);

    try {
      const body: Record<string, unknown> = {
        originalUrl: editForm.originalUrl,
        description: editForm.description,
        status: editForm.status,
      };

      if (editForm.expiration !== "keep") {
        body.expiration = editForm.expiration;
      }

      if (editForm.passwordAction === "change") {
        body.passwordProtected = true;
        body.password = editForm.password;
      }

      if (editForm.passwordAction === "remove") {
        body.removePassword = true;
        body.passwordProtected = false;
      }

      const response = await fetch(`/api/links/${linkId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data: LinkResponse = await response.json();

      if (!response.ok) {
        if (data.errors?.length) {
          toast.error(data.errors[0].message);
        } else {
          toast.error(data.message || "Failed to update link");
        }

        return;
      }

      if (data.data) {
        setLinks((prev) =>
          prev.map((link) => (link.id === linkId ? data.data! : link))
        );
      }

      toast.success(data.message || "Link updated successfully");
      cancelEditing();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleToggleStatus(link: LinkItem) {
    const nextStatus = link.status === "active" ? "disabled" : "active";

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

      const data: LinkResponse = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to update link status");
        return;
      }

      if (data.data) {
        setLinks((prev) =>
          prev.map((item) => (item.id === link.id ? data.data! : item))
        );
      }

      toast.success(
        nextStatus === "active" ? "Link enabled" : "Link disabled"
      );
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleDelete(linkId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this link?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/links/${linkId}`, {
        method: "DELETE",
      });

      const data: LinkResponse = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to delete link");
        return;
      }

      setLinks((prev) => prev.filter((link) => link.id !== linkId));
      toast.success(data.message || "Link deleted successfully");
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleCopy(link: LinkItem) {
    await navigator.clipboard.writeText(link.shortUrl);

    setCopiedId(link.id);
    toast.success("Copied to clipboard");

    setTimeout(() => {
      setCopiedId("");
    }, 2000);
  }

  function formatDate(value: string | null) {
    if (!value) return "Never";

    return new Date(value).toLocaleString();
  }

  function isExpired(link: LinkItem) {
    if (!link.expiresAt) return false;
    return new Date(link.expiresAt) < new Date();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Links</h1>
          <p className="mt-2 text-muted-foreground">
            Manage, edit, disable, and delete your short links.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search links..."
            className="pl-10"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading links...
          </CardContent>
        </Card>
      ) : filteredLinks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {links.length === 0
                ? "No links created yet."
                : "No links match your search."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLinks.map((link) => (
            <Card key={link.id}>
              <CardHeader>
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="truncate text-lg">
                        {link.shortUrl}
                      </CardTitle>

                      <span
                        className={
                          link.status === "active"
                            ? "rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-xs text-green-500"
                            : "rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-xs text-destructive"
                        }
                      >
                        {link.status}
                      </span>

                      {isExpired(link) && (
                        <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-500">
                          expired
                        </span>
                      )}

                      {link.passwordProtected && (
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                          <Lock className="mr-1 h-3 w-3" />
                          protected
                        </span>
                      )}
                    </div>

                    <CardDescription className="break-all">
                      {link.originalUrl}
                    </CardDescription>

                    {link.description && (
                      <p className="text-sm text-muted-foreground">
                        {link.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>Clicks: {link.totalClicks}</span>
                      <span>Expires: {formatDate(link.expiresAt)}</span>
                      <span>
                        Created: {new Date(link.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(link)}
                    >
                      {copiedId === link.id ? (
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="mr-2 h-4 w-4" />
                      )}
                      Copy
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(link.shortUrl, "_blank")}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => startEditing(link)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(link)}
                    >
                      {link.status === "active" ? (
                        <>
                          <X className="mr-2 h-4 w-4" />
                          Disable
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Enable
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(link.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {editingId === link.id && (
                <CardContent className="border-t pt-6">
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleUpdate(link.id);
                    }}
                    className="space-y-5"
                  >
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor={`originalUrl-${link.id}`}>
                          Destination URL
                        </FieldLabel>
                        <Input
                          id={`originalUrl-${link.id}`}
                          type="url"
                          value={editForm.originalUrl}
                          onChange={(event) =>
                            handleEditChange("originalUrl", event.target.value)
                          }
                        />
                      </Field>

                      <Field>
                        <FieldLabel htmlFor={`description-${link.id}`}>
                          Description
                        </FieldLabel>
                        <Textarea
                          id={`description-${link.id}`}
                          value={editForm.description}
                          onChange={(event) =>
                            handleEditChange("description", event.target.value)
                          }
                        />
                      </Field>

                      <div className="grid gap-4 md:grid-cols-2">
                        <Field>
                          <FieldLabel htmlFor={`status-${link.id}`}>
                            Status
                          </FieldLabel>
                          <select
                            id={`status-${link.id}`}
                            value={editForm.status}
                            onChange={(event) =>
                              handleEditChange(
                                "status",
                                event.target.value as EditForm["status"]
                              )
                            }
                            className="h-10 rounded-md border bg-background px-3 text-sm"
                          >
                            <option value="active">Active</option>
                            <option value="disabled">Disabled</option>
                          </select>
                        </Field>

                        <Field>
                          <FieldLabel htmlFor={`expiration-${link.id}`}>
                            Expiration
                          </FieldLabel>
                          <select
                            id={`expiration-${link.id}`}
                            value={editForm.expiration}
                            onChange={(event) =>
                              handleEditChange(
                                "expiration",
                                event.target.value as EditForm["expiration"]
                              )
                            }
                            className="h-10 rounded-md border bg-background px-3 text-sm"
                          >
                            <option value="keep">Keep current</option>
                            <option value="never">Never</option>
                            <option value="1hour">1 hour from now</option>
                            <option value="1day">1 day from now</option>
                            <option value="7days">7 days from now</option>
                            <option value="30days">30 days from now</option>
                          </select>
                        </Field>
                      </div>

                      <Field>
                        <FieldLabel htmlFor={`passwordAction-${link.id}`}>
                          Password Protection
                        </FieldLabel>

                        <select
                          id={`passwordAction-${link.id}`}
                          value={editForm.passwordAction}
                          onChange={(event) =>
                            handleEditChange(
                              "passwordAction",
                              event.target.value as EditForm["passwordAction"]
                            )
                          }
                          className="h-10 rounded-md border bg-background px-3 text-sm"
                        >
                          <option value="keep">
                            Keep current password setting
                          </option>
                          <option value="change">Set / change password</option>
                          <option value="remove">Remove password</option>
                        </select>

                        <FieldDescription>
                          Existing passwords cannot be viewed. You can only
                          replace or remove them.
                        </FieldDescription>
                      </Field>

                      {editForm.passwordAction === "change" && (
                        <Field>
                          <FieldLabel htmlFor={`password-${link.id}`}>
                            New Password
                          </FieldLabel>

                          <div className="relative">
                            <Unlock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id={`password-${link.id}`}
                              type="password"
                              placeholder="Minimum 6 characters"
                              className="pl-10"
                              value={editForm.password}
                              onChange={(event) =>
                                handleEditChange("password", event.target.value)
                              }
                            />
                          </div>
                        </Field>
                      )}
                    </FieldGroup>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="submit"
                        disabled={isUpdating}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={cancelEditing}
                        disabled={isUpdating}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}