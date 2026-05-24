import { z } from "zod";

const aliasRegex = /^[a-zA-Z0-9-_]+$/;

export const createLinkSchema = z.object({
  originalUrl: z
    .string()
    .url("Enter a valid URL")
    .refine((url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    }, "Only HTTP and HTTPS URLs are allowed"),

  customAlias: z
    .string()
    .trim()
    .min(3, "Alias must be at least 3 characters")
    .max(50, "Alias must be less than 50 characters")
    .regex(aliasRegex, "Alias can only contain letters, numbers, hyphens, and underscores")
    .optional()
    .or(z.literal("")),

  description: z
    .string()
    .trim()
    .max(300, "Description must be less than 300 characters")
    .optional()
    .or(z.literal("")),

  expiration: z
    .enum(["never", "1hour", "1day", "7days", "30days"])
    .default("never"),

  passwordProtected: z.boolean().default(false),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be less than 100 characters")
    .optional()
    .or(z.literal("")),
});

export const updateLinkSchema = z.object({
  originalUrl: z
    .string()
    .url("Enter a valid URL")
    .refine((url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    }, "Only HTTP and HTTPS URLs are allowed")
    .optional(),

  description: z
    .string()
    .trim()
    .max(300, "Description must be less than 300 characters")
    .optional()
    .or(z.literal("")),

  status: z
    .enum(["active", "disabled"])
    .optional(),

  expiration: z
    .enum(["never", "1hour", "1day", "7days", "30days"])
    .optional(),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;