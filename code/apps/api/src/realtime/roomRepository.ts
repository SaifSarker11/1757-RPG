import { db } from "@repo/db";
import type { MatchSummary } from "@repo/game-engine";
import type { MatchContext } from "../persistence/matchRecord.js";
import { saveMatch } from "../persistence/saveMatch.js";
import { readRoleAssignments } from "../lobby/views.js";

export interface StartableRoom {
  id: string;
  code: string;
  hostUserId: string;
  status: "WAITING" | "IN_PROGRESS" | "FINISHED";
  discussionSeconds: number;
  enabledRoles: string[];
  mode: "STANDARD" | "CUSTOM";
  roundDiscussionSeconds: number[];
  /** userId -> role pinned by the host (custom rooms). */
  roleAssignments: Record<string, string>;
  players: Array<{ userId: string; createdAt: Date; isAnonymous: boolean }>;
}

/** The database calls the realtime layer needs. Postgres is touched only at start and end. */
export interface GameRoomRepository {
  loadForStart(roomId: string): Promise<StartableRoom | null>;
  isMember(roomId: string, userId: string): Promise<boolean>;
  /** WAITING → IN_PROGRESS. False if another request already started it. */
  claimForStart(roomId: string): Promise<boolean>;
  markFinished(roomId: string, greenWins: number, redWins: number): Promise<void>;
  saveMatch(summary: MatchSummary, ctx: MatchContext): Promise<{ id: string }>;
  /** Deletes the room only if it is still a lobby. True if it was deleted. */
  deleteIfWaiting(roomId: string): Promise<boolean>;
}

export const prismaRoomRepository: GameRoomRepository = {
  async loadForStart(roomId) {
    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { players: { include: { user: { select: { isAnonymous: true } } } } },
    });
    if (!room) return null;
    return {
      id: room.id,
      code: room.code,
      hostUserId: room.hostUserId,
      status: room.status,
      discussionSeconds: room.discussionSeconds,
      enabledRoles: room.enabledRoles,
      mode: room.mode,
      roundDiscussionSeconds: room.roundDiscussionSeconds,
      roleAssignments: readRoleAssignments(room.roleAssignments),
      players: room.players.map((p) => ({
        userId: p.userId,
        createdAt: p.createdAt,
        isAnonymous: p.user?.isAnonymous ?? true,
      })),
    };
  },

  async isMember(roomId, userId) {
    const player = await db.roomPlayer.findUnique({
      where: { roomId_userId: { roomId, userId } },
      select: { id: true },
    });
    return player !== null;
  },

  async claimForStart(roomId) {
    const { count } = await db.room.updateMany({
      where: { id: roomId, status: "WAITING" },
      data: { status: "IN_PROGRESS", currentRound: 1 },
    });
    return count === 1;
  },

  async markFinished(roomId, greenWins, redWins) {
    await db.room.updateMany({
      where: { id: roomId },
      data: { status: "FINISHED", greenWins, redWins },
    });
  },

  saveMatch(summary, ctx) {
    return saveMatch(db, summary, ctx);
  },

  async deleteIfWaiting(roomId) {
    const { count } = await db.room.deleteMany({ where: { id: roomId, status: "WAITING" } });
    return count > 0;
  },
};
