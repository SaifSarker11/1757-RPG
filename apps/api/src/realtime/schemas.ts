import { z } from "zod";
import type { Action, ErrorCode } from "@repo/game-engine";

const id = z.string().min(1).max(128);

export const roomRefPayload = z.object({ roomId: z.string().min(1).max(64) });

/** Actions a client may send. The acting player is never in the payload. */
export const clientAction = z.discriminatedUnion("type", [
  z.object({ type: z.literal("NOMINATE"), ministerIds: z.array(id).min(1).max(15) }),
  z.object({ type: z.literal("CAST_VOTE"), vote: z.enum(["APPROVE", "REJECT"]) }),
  z.object({ type: z.literal("PLAY_CARD"), card: z.enum(["SUCCESS", "SABOTAGE"]) }),
  z.object({ type: z.literal("DEBUSSY_REVEAL"), targetId: id }),
  z.object({ type: z.literal("JEANLAW_LOCK"), targetId: id }),
  z.object({ type: z.literal("GUESS"), targetId: id }),
]);

export type ClientAction = z.infer<typeof clientAction>;

export const gameActionPayload = roomRefPayload.extend({ action: clientAction });

/** Attaches the session player to a validated client action. */
export function toEngineAction(action: ClientAction, playerId: string): Action {
  return { ...action, playerId };
}

export type RealtimeErrorCode =
  | ErrorCode
  | "UNAUTHORIZED"
  | "INVALID_PAYLOAD"
  | "RATE_LIMITED"
  | "ROOM_NOT_FOUND"
  | "NOT_IN_ROOM"
  | "NOT_HOST"
  | "GAME_ALREADY_STARTED"
  | "INVALID_PLAYER_COUNT"
  | "INVALID_SETTINGS"
  | "SKIP_NOT_ALLOWED"
  | "NOTHING_TO_SKIP"
  | "NO_GAME"
  | "INTERNAL";

const MESSAGES: Partial<Record<RealtimeErrorCode, string>> = {
  UNAUTHORIZED: "Sign in to do that",
  INVALID_PAYLOAD: "Malformed request",
  RATE_LIMITED: "Slow down",
  ROOM_NOT_FOUND: "Room not found",
  NOT_IN_ROOM: "You are not in this room",
  NOT_HOST: "Only the host can do that",
  GAME_ALREADY_STARTED: "The game has already started",
  INVALID_PLAYER_COUNT: "A game needs 6 to 15 players",
  INVALID_SETTINGS: "The room settings don't work for this many players",
  SKIP_NOT_ALLOWED: "Skipping is only available in custom rooms",
  NOTHING_TO_SKIP: "There is no timer to skip right now",
  NO_GAME: "No game is running in this room",
  INTERNAL: "Something went wrong",
};

export interface RealtimeError {
  code: RealtimeErrorCode;
  message: string;
}

export function realtimeError(code: RealtimeErrorCode, message?: string): RealtimeError {
  return { code, message: message ?? MESSAGES[code] ?? code.replace(/_/g, " ").toLowerCase() };
}
