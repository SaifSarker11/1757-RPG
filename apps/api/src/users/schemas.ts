import { z } from "zod";

export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,15}$/;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty").max(50, "Name too long").optional(),
  username: z
    .string()
    .trim()
    .regex(USERNAME_REGEX, "Username must be 3-15 characters and alphanumeric (or underscore)")
    .optional(),
  avatarId: z.string().trim().min(1).max(50).optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const statsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  offset: z.coerce.number().int().min(0).default(0),
});

export type StatsQueryInput = z.infer<typeof statsQuerySchema>;
