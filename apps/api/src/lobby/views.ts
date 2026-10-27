import type { NamedRoleId } from "@repo/game-engine";
import type { RoomMode } from "./schemas.js";

/** Shape of a room as loaded from Prisma with its players and their users. */
export interface RoomRow {
  id: string;
  code: string;
  hostUserId: string;
  status: "WAITING" | "IN_PROGRESS" | "FINISHED";
  maxPlayers: number;
  isPublic: boolean;
  discussionSeconds: number;
  enabledRoles: string[];
  mode: RoomMode;
  roundDiscussionSeconds: number[];
  /** userId -> role. Host-only; only its size reaches the room detail. */
  roleAssignments: unknown;
  bannedUserIds: string[];
  currentRound: number;
  greenWins: number;
  redWins: number;
  createdAt: Date;
  players: Array<{
    userId: string;
    role: string | null;
    createdAt: Date;
    user: { name: string } | null;
  }>;
}

export interface RoomDetail {
  id: string;
  code: string;
  hostUserId: string;
  status: RoomRow["status"];
  maxPlayers: number;
  playerCount: number;
  isPublic: boolean;
  discussionSeconds: number;
  enabledRoles: NamedRoleId[];
  mode: RoomMode;
  roundDiscussionSeconds: number[];
  /** How many present players have a pinned role. Who gets what stays with the host. */
  fixedRoleCount: number;
  inviteUrl: string;
  currentRound: number;
  greenWins: number;
  redWins: number;
  /** Which roles are in the match, not who holds them. Empty in the lobby. */
  rolesInPlay: string[];
  /** No roles or teams here: those are private (see viewFor). */
  players: Array<{ userId: string; name: string }>;
}

export interface LobbyListing {
  id: string;
  code: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  discussionSeconds: number;
  mode: RoomMode;
}

export function inviteUrl(code: string, webUrl = process.env.WEB_URL ?? "http://localhost:3000"): string {
  return `${webUrl.replace(/\/$/, "")}/join/${code}`;
}

/** Reads the stored JSON defensively; anything malformed counts as no assignment. */
export function readRoleAssignments(raw: unknown): Record<string, string> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};
  return Object.fromEntries(
    Object.entries(raw).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  );
}

function displayName(p: RoomRow["players"][number]): string {
  return p.user?.name ?? `Player ${p.userId.slice(-4)}`;
}

function byJoinOrder(players: RoomRow["players"]): RoomRow["players"] {
  return [...players].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export function toRoomDetail(room: RoomRow): RoomDetail {
  const started = room.status !== "WAITING";
  return {
    id: room.id,
    code: room.code,
    hostUserId: room.hostUserId,
    status: room.status,
    maxPlayers: room.maxPlayers,
    playerCount: room.players.length,
    isPublic: room.isPublic,
    discussionSeconds: room.discussionSeconds,
    enabledRoles: room.enabledRoles as NamedRoleId[],
    mode: room.mode,
    roundDiscussionSeconds: room.roundDiscussionSeconds,
    fixedRoleCount: countFixedRoles(room),
    inviteUrl: inviteUrl(room.code),
    currentRound: room.currentRound,
    greenWins: room.greenWins,
    redWins: room.redWins,
    rolesInPlay: started ? room.players.flatMap((p) => (p.role ? [p.role] : [])).sort() : [],
    players: byJoinOrder(room.players).map((p) => ({ userId: p.userId, name: displayName(p) })),
  };
}

export function toLobbyListing(room: RoomRow): LobbyListing {
  const host = room.players.find((p) => p.userId === room.hostUserId);
  return {
    id: room.id,
    code: room.code,
    hostName: host ? displayName(host) : "Unknown host",
    playerCount: room.players.length,
    maxPlayers: room.maxPlayers,
    discussionSeconds: room.discussionSeconds,
    mode: room.mode,
  };
}

function countFixedRoles(room: RoomRow): number {
  if (room.mode !== "CUSTOM") return 0;
  const assignments = readRoleAssignments(room.roleAssignments);
  return room.players.filter((p) => assignments[p.userId] !== undefined).length;
}
