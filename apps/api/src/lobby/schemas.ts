import { z } from "zod";
import {
  ALL_NAMED_ROLES,
  DISCUSSION_SECONDS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  type NamedRoleId,
} from "@repo/game-engine";

// Bounds come from the engine's gameConfig so rules live in one place.
const namedRole = z.enum(ALL_NAMED_ROLES as unknown as [NamedRoleId, ...NamedRoleId[]]);

export const roomSettingsSchema = z.object({
  maxPlayers: z.number().int().min(MIN_PLAYERS).max(MAX_PLAYERS),
  discussionSeconds: z.number().int().min(DISCUSSION_SECONDS.min).max(DISCUSSION_SECONDS.max),
  enabledRoles: z.array(namedRole).max(ALL_NAMED_ROLES.length),
  isPublic: z.boolean(),
});

export type RoomSettings = z.infer<typeof roomSettingsSchema>;

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  maxPlayers: MAX_PLAYERS,
  discussionSeconds: DISCUSSION_SECONDS.default,
  enabledRoles: [...ALL_NAMED_ROLES],
  isPublic: true,
};

/** Create: every setting optional. Unknown keys (e.g. a legacy `hostUserId`) are stripped. */
export const createRoomBody = roomSettingsSchema.partial();

/** Update: at least one setting. */
export const updateSettingsBody = roomSettingsSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one setting" });

export const kickBody = z.object({ userId: z.string().min(1).max(128) });

export const roomIdParams = z.object({ roomId: z.string().min(1).max(64) });

export const codeParams = z.object({ code: z.string().min(1).max(16) });

export type ParseResult<T> = { ok: true; data: T } | { ok: false; message: string };

export function parse<T>(schema: z.ZodType<T>, input: unknown): ParseResult<T> {
  const result = schema.safeParse(input ?? {});
  if (result.success) return { ok: true, data: result.data };
  const issue = result.error.issues[0];
  const path = issue?.path.join(".");
  return { ok: false, message: path ? `${path}: ${issue?.message}` : (issue?.message ?? "Invalid input") };
}
