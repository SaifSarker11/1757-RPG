import { z } from "zod";

export const adminPaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().trim().optional(),
});

export type AdminPaginationInput = z.infer<typeof adminPaginationSchema>;

export const userModerationSchema = z.object({
  isBanned: z.boolean().optional(),
  name: z.string().trim().min(1).max(50).optional(),
});

export type UserModerationInput = z.infer<typeof userModerationSchema>;
