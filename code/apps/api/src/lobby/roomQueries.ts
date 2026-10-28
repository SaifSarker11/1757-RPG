import { db } from "@repo/db";
import type { LobbyRoom } from "./rules.js";
import { toLobbyListing, toRoomDetail, type LobbyListing, type RoomDetail, type RoomRow } from "./views.js";

const PUBLIC_LIST_LIMIT = 50;
const QUICK_JOIN_SCAN_LIMIT = 100;

export const roomInclude = {
  players: { include: { user: { select: { name: true } } } },
} as const;

export async function loadRoomRow(roomId: string): Promise<RoomRow | null> {
  return db.room.findUnique({ where: { id: roomId }, include: roomInclude });
}

export async function loadRoomDetail(roomId: string): Promise<RoomDetail | null> {
  const room = await loadRoomRow(roomId);
  return room ? toRoomDetail(room) : null;
}

/** Open public lobbies, newest first, without full rooms. */
export async function listPublicRooms(): Promise<LobbyListing[]> {
  const rooms = await db.room.findMany({
    where: { isPublic: true, status: "WAITING" },
    include: roomInclude,
    orderBy: { createdAt: "desc" },
    take: PUBLIC_LIST_LIMIT,
  });
  return rooms.filter((r) => r.players.length < r.maxPlayers).map(toLobbyListing);
}

/** Candidates for Quick Join; the rules pick one. */
export async function listQuickJoinCandidates(): Promise<LobbyRoom[]> {
  return db.room.findMany({
    where: { isPublic: true, status: "WAITING" },
    include: { players: { select: { userId: true, createdAt: true } } },
    orderBy: { createdAt: "asc" },
    take: QUICK_JOIN_SCAN_LIMIT,
  });
}

export async function isRoomCodeTaken(code: string): Promise<boolean> {
  return (await db.room.findUnique({ where: { code }, select: { id: true } })) !== null;
}
