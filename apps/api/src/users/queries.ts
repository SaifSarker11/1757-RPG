import type { db } from "@repo/db";
import { calculateLevel } from "./xp.js";

export type DbClient = typeof db;

export interface UserStatsSummary {
  userId: string;
  username: string | null;
  name: string;
  avatarId: string | null;
  xp: number;
  level: number;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  winRate: number;
  forfeits: number;
  humiliations: number; // Jean Law locked
}

export interface MatchHistoryItem {
  matchId: string;
  roomCode: string;
  endedAt: Date;
  role: string;
  team: string;
  won: boolean;
  jeanLawLocked: boolean;
  disconnectedForfeit: boolean;
  playerCount: number;
  winner: string;
}

export async function getUserProfile(client: DbClient, userId: string) {
  const user = await client.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      avatarId: true,
      xp: true,
      level: true,
      isAnonymous: true,
      createdAt: true,
    },
  });
  if (!user) return null;

  // Ensure level is consistent with xp
  const accurateLevel = calculateLevel(user.xp);
  return {
    ...user,
    level: Math.max(user.level, accurateLevel),
  };
}

export async function getUserStats(client: DbClient, userId: string): Promise<UserStatsSummary | null> {
  const user = await getUserProfile(client, userId);
  if (!user) return null;

  const records = await client.matchPlayer.findMany({
    where: { userId },
    select: {
      won: true,
      jeanLawLocked: true,
      disconnectedForfeit: true,
    },
  });

  const matchesPlayed = records.length;
  const matchesWon = records.filter((r) => r.won).length;
  const matchesLost = matchesPlayed - matchesWon;
  const forfeits = records.filter((r) => r.disconnectedForfeit).length;
  const humiliations = records.filter((r) => r.jeanLawLocked).length;
  const winRate = matchesPlayed > 0 ? Math.round((matchesWon / matchesPlayed) * 100) : 0;

  return {
    userId: user.id,
    username: user.username,
    name: user.name,
    avatarId: user.avatarId,
    xp: user.xp,
    level: user.level,
    matchesPlayed,
    matchesWon,
    matchesLost,
    winRate,
    forfeits,
    humiliations,
  };
}

export async function getMatchHistory(
  client: DbClient,
  userId: string,
  pagination: { limit: number; offset: number }
): Promise<{ matches: MatchHistoryItem[]; total: number }> {
  const [total, records] = await Promise.all([
    client.matchPlayer.count({ where: { userId } }),
    client.matchPlayer.findMany({
      where: { userId },
      include: {
        match: {
          select: {
            id: true,
            roomCode: true,
            endedAt: true,
            playerCount: true,
            winner: true,
          },
        },
      },
      orderBy: { match: { endedAt: "desc" } },
      take: pagination.limit,
      skip: pagination.offset,
    }),
  ]);

  const matches: MatchHistoryItem[] = records.map((r) => ({
    matchId: r.match.id,
    roomCode: r.match.roomCode,
    endedAt: r.match.endedAt,
    role: r.role,
    team: r.team,
    won: r.won,
    jeanLawLocked: r.jeanLawLocked,
    disconnectedForfeit: r.disconnectedForfeit,
    playerCount: r.match.playerCount,
    winner: r.match.winner,
  }));

  return { matches, total };
}
