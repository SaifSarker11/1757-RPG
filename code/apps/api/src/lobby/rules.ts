import type { RoomSettings } from "./schemas.js";

/** The parts of a room the lobby rules need. Mirrors the Prisma `Room` + players. */
export interface LobbyRoom {
  id: string;
  hostUserId: string;
  status: "WAITING" | "IN_PROGRESS" | "FINISHED";
  maxPlayers: number;
  isPublic: boolean;
  bannedUserIds: string[];
  createdAt: Date;
  players: Array<{ userId: string; createdAt: Date }>;
}

export type LobbyError =
  | "ROOM_NOT_FOUND"
  | "GAME_ALREADY_STARTED"
  | "GAME_IN_PROGRESS"
  | "ROOM_FULL"
  | "ALREADY_IN_ROOM"
  | "BANNED"
  | "NOT_HOST"
  | "NOT_IN_ROOM"
  | "CANNOT_KICK_SELF"
  | "MAX_BELOW_PLAYER_COUNT"
  | "NO_OPEN_ROOM";

export const LOBBY_ERRORS: Readonly<Record<LobbyError, { status: number; message: string }>> = {
  ROOM_NOT_FOUND: { status: 404, message: "Room not found" },
  GAME_ALREADY_STARTED: { status: 409, message: "Game already started" },
  GAME_IN_PROGRESS: { status: 409, message: "Can't do that while a game is in progress" },
  ROOM_FULL: { status: 409, message: "Room is full" },
  // The web client matches on this exact text.
  ALREADY_IN_ROOM: { status: 409, message: "User already in room" },
  BANNED: { status: 403, message: "You were removed from this room" },
  NOT_HOST: { status: 403, message: "Only the host can do that" },
  NOT_IN_ROOM: { status: 404, message: "Player not in room" },
  CANNOT_KICK_SELF: { status: 400, message: "The host can't kick themself" },
  MAX_BELOW_PLAYER_COUNT: { status: 409, message: "Max players can't be below the current player count" },
  NO_OPEN_ROOM: { status: 404, message: "No open public room right now" },
};

const isMember = (room: LobbyRoom, userId: string) => room.players.some((p) => p.userId === userId);

export function joinError(room: LobbyRoom, userId: string): LobbyError | null {
  if (isMember(room, userId)) return "ALREADY_IN_ROOM";
  if (room.status !== "WAITING") return "GAME_ALREADY_STARTED";
  if (room.bannedUserIds.includes(userId)) return "BANNED";
  if (room.players.length >= room.maxPlayers) return "ROOM_FULL";
  return null;
}

/** Leaving mid-game is a disconnect, handled by reconnection, not a lobby leave. */
export function leaveError(room: LobbyRoom, userId: string): LobbyError | null {
  if (!isMember(room, userId)) return "NOT_IN_ROOM";
  if (room.status === "IN_PROGRESS") return "GAME_IN_PROGRESS";
  return null;
}

export function kickError(room: LobbyRoom, actorId: string, targetId: string): LobbyError | null {
  if (room.hostUserId !== actorId) return "NOT_HOST";
  if (room.status !== "WAITING") return "GAME_ALREADY_STARTED";
  if (actorId === targetId) return "CANNOT_KICK_SELF";
  if (!isMember(room, targetId)) return "NOT_IN_ROOM";
  return null;
}

export function settingsError(
  room: LobbyRoom,
  actorId: string,
  update: Partial<RoomSettings>
): LobbyError | null {
  if (room.hostUserId !== actorId) return "NOT_HOST";
  if (room.status !== "WAITING") return "GAME_ALREADY_STARTED";
  if (update.maxPlayers !== undefined && update.maxPlayers < room.players.length) {
    return "MAX_BELOW_PLAYER_COUNT";
  }
  return null;
}

/**
 * The next host when `leavingId` leaves (US_13): the player who has been in
 * the room longest, preferring players who are online when presence is known.
 * Null when nobody is left.
 */
export function pickNewHost(
  room: LobbyRoom,
  leavingId: string,
  isOnline: (userId: string) => boolean = () => true
): string | null {
  const remaining = room.players
    .filter((p) => p.userId !== leavingId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return (remaining.find((p) => isOnline(p.userId)) ?? remaining[0])?.userId ?? null;
}

/** Quick Join (US_3): the fullest open public room the user may join; oldest breaks ties. */
export function pickQuickJoin(rooms: readonly LobbyRoom[], userId: string): LobbyRoom | null {
  const open = rooms.filter((r) => r.isPublic && joinError(r, userId) === null);
  open.sort(
    (a, b) => b.players.length - a.players.length || a.createdAt.getTime() - b.createdAt.getTime()
  );
  return open[0] ?? null;
}
