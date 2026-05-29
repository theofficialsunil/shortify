import { z } from "zod";

export const usernameSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(
      /^[a-z0-9-_]+$/,
      "Username can only contain lowercase letters, numbers, hyphens, and underscores"
    ),
});

export type UsernameInput = z.infer<typeof usernameSchema>;