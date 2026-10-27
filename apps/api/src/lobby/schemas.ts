import { z } from "zod";
import {
  ALL_NAMED_ROLES,
  DISCUSSION_SECONDS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  TOTAL_ROUNDS,
  type NamedRoleId,
  type RoleId,
} from "@repo/game-engine";

// Bounds come from the engine's gameConfig so rules live in one place.
const namedRole = z.enum(ALL_NAMED_ROLES as unknown as [NamedRoleId, ...NamedRoleId[]]);
const anyRole = z.enum([...ALL_NAMED_ROLES, "LOYALIST", "EIC_SPY"] as unknown as [RoleId, ...RoleId[]]);
const seconds = z.number().int().min(DISCUSSION_SECONDS.min).max(DISCUSSION_SECONDS.max);

export const ROOM_MODES = ["STANDARD", "CUSTOM"] as const;
export type RoomMode = (typeof ROOM_MODES)[number];

/** userId -> pinned role. A named role can be pinned to one player only; fillers repeat. */
const roleAssignments = z
  .record(z.string().min(1).max(128), anyRole)
  .refine((v) => Object.keys(v).length <= MAX_PLAYERS, { message: `At most ${MAX_PLAYERS} assignments` })
  .refine(
    (v) => {
      const named = Object.values(v).filter((r) => r !== "LOYALIST" && r !== "EIC_SPY");
      return new Set(named).size === named.length;
    },
    { message: "Each character can be assigned to one player only" }
  );

export const roomSettingsSchema = z.object({
  maxPlayers: z.number().int().min(MIN_PLAYERS).max(MAX_PLAYERS),
  discussionSeconds: seconds,
  enabledRoles: z.array(namedRole).max(ALL_NAMED_ROLES.length),
  isPublic: z.boolean(),
  mode: z.enum(ROOM_MODES),
  /** Custom rooms only: Discussion length for R1-R5. Empty = `discussionSeconds` every round. */
  roundDiscussionSeconds: z.array(seconds).max(TOTAL_ROUNDS),
  /** Custom rooms only. Host-only data: never part of the room detail. */
  roleAssignments,
});

export type RoomSettings = z.infer<typeof roomSettingsSchema>;

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  maxPlayers: MAX_PLAYERS,
  discussionSeconds: DISCUSSION_SECONDS.default,
  enabledRoles: [...ALL_NAMED_ROLES],
  isPublic: true,
  mode: "STANDARD",
  roundDiscussionSeconds: [],
  roleAssignments: {},
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
