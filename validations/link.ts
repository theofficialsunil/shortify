import { z } from "zod";

const aliasRegex = /^[a-zA-Z0-9-_]+$/;

const urlSchema = z
  .string()
  .url("Enter a valid URL")
  .refine((url) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }, "Only HTTP and HTTPS URLs are allowed");

export const createLinkSchema = z
  .object({
    originalUrl: urlSchema,

    customAlias: z
      .string()
      .trim()
      .min(3, "Alias must be at least 3 characters")
      .max(50, "Alias must be less than 50 characters")
      .regex(
        aliasRegex,
        "Alias can only contain letters, numbers, hyphens, and underscores"
      )
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
      .trim()
      .max(100, "Password must be less than 100 characters")
      .optional()
      .or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.passwordProtected && (!data.password || data.password.length < 6)) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "Password must be at least 6 characters",
      });
    }
  });

export const updateLinkSchema = z.object({
  originalUrl: urlSchema.optional(),

  description: z
    .string()
    .trim()
    .max(300, "Description must be less than 300 characters")
    .optional()
    .or(z.literal("")),

  status: z.enum(["active", "disabled"]).optional(),

  expiration: z
    .enum(["never", "1hour", "1day", "7days", "30days"])
    .optional(),

  passwordProtected: z.boolean().optional(),

  password: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || value.length >= 6, {
      message: "Password must be at least 6 characters",
    })
    .refine((value) => !value || value.length <= 100, {
      message: "Password must be less than 100 characters",
    }),

  removePassword: z.boolean().optional(),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;