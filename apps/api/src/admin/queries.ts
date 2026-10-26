import type { db } from "@repo/db";

export type DbClient = typeof db;

export interface TelemetryOverview {
  totalUsers: number;
  registeredUsers: number;
  anonymousUsers: number;
  totalRooms: number;
  activeRooms: number;
  finishedMatches: number;
  greenWins: number;
  redWins: number;
  goldWins: number;
  winRateGreen: number;
  winRateRed: number;
  averagePlayerCount: number;
}

export async function getTelemetryOverview(client: DbClient): Promise<TelemetryOverview> {
  const [
    totalUsers,
    anonymousUsers,
    totalRooms,
    activeRooms,
    matches,
  ] = await Promise.all([
    client.user.count(),
    client.user.count({ where: { isAnonymous: true } }),
    client.room.count(),
    client.room.count({ where: { status: "IN_PROGRESS" } }),
    client.match.findMany({
      select: {
        winner: true,
        playerCount: true,
      },
    }),
  ]);

  const finishedMatches = matches.length;
  const greenWins = matches.filter((m) => m.winner === "GREEN").length;
  const redWins = matches.filter((m) => m.winner === "RED").length;
  const goldWins = matches.filter((m) => m.winner === "GOLD").length;

  const winRateGreen = finishedMatches > 0 ? Math.round((greenWins / finishedMatches) * 100) : 0;
  const winRateRed = finishedMatches > 0 ? Math.round((redWins / finishedMatches) * 100) : 0;

  const totalPlayersInMatches = matches.reduce((acc, m) => acc + m.playerCount, 0);
  const averagePlayerCount = finishedMatches > 0 ? Math.round((totalPlayersInMatches / finishedMatches) * 10) / 10 : 0;

  return {
    totalUsers,
    registeredUsers: totalUsers - anonymousUsers,
    anonymousUsers,
    totalRooms,
    activeRooms,
    finishedMatches,
    greenWins,
    redWins,
    goldWins,
    winRateGreen,
    winRateRed,
    averagePlayerCount,
  };
}

export async function listAdminMatches(
  client: DbClient,
  pagination: { limit: number; offset: number; search?: string }
) {
  const where = pagination.search
    ? { roomCode: { contains: pagination.search.toUpperCase() } }
    : undefined;

  const [total, matches] = await Promise.all([
    client.match.count({ where }),
    client.match.findMany({
      where,
      orderBy: { endedAt: "desc" },
      take: pagination.limit,
      skip: pagination.offset,
      select: {
        id: true,
        roomCode: true,
        playerCount: true,
        startedAt: true,
        endedAt: true,
        winner: true,
        reason: true,
        roundsGreen: true,
        roundsRed: true,
      },
    }),
  ]);

  return { matches, total };
}

export async function listAdminUsers(
  client: DbClient,
  pagination: { limit: number; offset: number; search?: string }
) {
  const where = pagination.search
    ? {
        OR: [
          { name: { contains: pagination.search, mode: "insensitive" as const } },
          { username: { contains: pagination.search, mode: "insensitive" as const } },
          { email: { contains: pagination.search, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [total, users] = await Promise.all([
    client.user.count({ where }),
    client.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pagination.limit,
      skip: pagination.offset,
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
    }),
  ]);

  return { users, total };
}

export async function listAdminActiveRooms(client: DbClient) {
  return client.room.findMany({
    where: { status: { in: ["WAITING", "IN_PROGRESS"] } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      code: true,
      status: true,
      maxPlayers: true,
      isPublic: true,
      discussionSeconds: true,
      currentRound: true,
      createdAt: true,
      players: {
        select: {
          id: true,
          userId: true,
          user: { select: { name: true, username: true } },
        },
      },
    },
  });
}
