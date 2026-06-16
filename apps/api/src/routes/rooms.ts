import { FastifyInstance } from "fastify";
import { randomBytes } from "crypto";
import { db, RoomStatus } from "@repo/db";
import { assignRoles } from "../services/roleAssignmentService.js";

function generateRoomCode(): string {
  const bytes = randomBytes(4);
  const code = bytes
    .toString("hex")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .padEnd(6, "A");
  return code.slice(0, 6);
}

async function generateUniqueRoomCode(): Promise<string> {
  let code: string;
  let exists: boolean;
  do {
    code = generateRoomCode();
    exists = await db.room.findUnique({ where: { code } }) !== null;
  } while (exists);
  return code;
}

function generateId(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

type CreateRoomBody = {
  hostUserId: string;
  maxPlayers: number;
};

type JoinRoomBody = {
  userId: string;
};

type LeaveRoomBody = {
  userId: string;
};

type StartRoomBody = {
  userId: string;
};

type CreateRoomResponse = {
  roomId: string;
  status: RoomStatus;
  maxPlayers: number;
  hostUserId: string;
};

type JoinRoomResponse = {
  roomId: string;
  userId: string;
  playerCount: number;
};

type LeaveRoomResponse = {
  roomId: string;
  userId: string;
  newHostUserId: string | null;
};

type GetRoomResponse = {
  id: string;
  hostUserId: string;
  status: RoomStatus;
  maxPlayers: number;
  currentRound: number;
  greenWins: number;
  redWins: number;
  players: { userId: string; team: string | null }[];
};

export async function registerRoomRoutes(app: FastifyInstance) {
  if (process.env.NODE_ENV !== "production") {
    app.post("/rooms/dev/create-user", async (request, reply) => {
      const { name } = request.body as { name?: string };
      const id = generateId();
      const email = `${id}@test.local`;
      const user = await db.user.create({
        data: { id, name: name || "Test User", email },
      });
      return reply.send({ data: { userId: user.id, token: id }, success: true });
    });
  }

  app.post("/rooms", async (request, reply) => {
    const body = request.body as CreateRoomBody;

    if (!body.hostUserId || typeof body.hostUserId !== "string") {
      return reply.status(400).send({ error: "hostUserId required", success: false });
    }

    if (!Number.isInteger(body.maxPlayers) || body.maxPlayers < 6 || body.maxPlayers > 15) {
      return reply.status(400).send({ error: "maxPlayers must be an integer between 6 and 15", success: false });
    }

    const user = await db.user.findUnique({ where: { id: body.hostUserId } });
    if (!user) {
      return reply.status(400).send({ error: "User not found", success: false });
    }

    const code = await generateUniqueRoomCode();

    const room = await db.room.create({
      data: {
        code,
        hostUserId: body.hostUserId,
        maxPlayers: body.maxPlayers,
        status: "WAITING",
        currentRound: 0,
        players: {
          create: {
            userId: body.hostUserId,
          },
        },
      },
    });

    return {
      roomId: room.id,
      status: room.status,
      maxPlayers: room.maxPlayers,
      hostUserId: room.hostUserId,
    };
  });

  app.post("/rooms/:roomId/join", async (request, reply) => {
    const { roomId } = request.params as { roomId: string };
    const body = request.body as JoinRoomBody;

    if (!body.userId || typeof body.userId !== "string") {
      return reply.status(400).send({ error: "userId required", success: false });
    }

    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { players: true, _count: { select: { players: true } } },
    });

    if (!room) {
      return reply.status(404).send({ error: "Room not found", success: false });
    }

    if (room.status !== RoomStatus.WAITING) {
      return reply.status(400).send({ error: "Game already started", success: false });
    }

    const playerCount = room._count.players;
    if (playerCount >= room.maxPlayers) {
      return reply.status(400).send({ error: "Room is full", success: false });
    }

    const existingPlayer = room.players.find((p) => p.userId === body.userId);
    if (existingPlayer) {
      return reply.status(400).send({ error: "User already in room", success: false });
    }

    await db.roomPlayer.create({
      data: {
        roomId,
        userId: body.userId,
      },
    });

    return {
      roomId,
      userId: body.userId,
      playerCount: playerCount + 1,
    };
  });

  app.post("/rooms/:roomId/leave", async (request, reply) => {
    const { roomId } = request.params as { roomId: string };
    const body = request.body as LeaveRoomBody;

    if (!body.userId || typeof body.userId !== "string") {
      return reply.status(400).send({ error: "userId required", success: false });
    }

    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { players: { orderBy: { createdAt: "asc" } } },
    });

    if (!room) {
      return reply.status(404).send({ error: "Room not found", success: false });
    }

    const player = room.players.find((p) => p.userId === body.userId);
    if (!player) {
      return reply.status(404).send({ error: "Player not in room", success: false });
    }

    const wasHost = room.hostUserId === body.userId;
    await db.roomPlayer.delete({ where: { id: player.id } });

    let newHostUserId: string | null = null;

    if (wasHost) {
      const remainingPlayers = room.players.filter((p) => p.userId !== body.userId);
      if (remainingPlayers.length > 0) {
        newHostUserId = remainingPlayers[0].userId;
        await db.room.update({
          where: { id: roomId },
          data: { hostUserId: newHostUserId },
        });
      } else {
        await db.room.delete({ where: { id: roomId } });
      }
    }

    return {
      roomId,
      userId: body.userId,
      newHostUserId,
    };
  });

  app.get("/rooms/:roomId", async (request, reply) => {
    const { roomId } = request.params as { roomId: string };

    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { players: true },
    });

    if (!room) {
      return reply.status(404).send({ error: "Room not found", success: false });
    }

    return {
      id: room.id,
      hostUserId: room.hostUserId,
      status: room.status,
      maxPlayers: room.maxPlayers,
      currentRound: room.currentRound,
      greenWins: room.greenWins,
      redWins: room.redWins,
      players: room.players.map((p) => ({
        userId: p.userId,
        team: p.team,
      })),
    };
  });

  app.post("/rooms/:roomId/start", async (request, reply) => {
    const { roomId } = request.params as { roomId: string };
    const body = request.body as StartRoomBody;
    const userId = body.userId;

    if (!userId) {
      return reply.status(400).send({ error: "userId required", success: false });
    }

    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { players: true },
    });

    if (!room) {
      return reply.status(404).send({ error: "Room not found", success: false });
    }

    if (room.hostUserId !== userId) {
      return reply.status(403).send({ error: "Only host can start game", success: false });
    }

    if (room.players.length < 6 || room.players.length > 15) {
      return reply.status(400).send({ error: "Player count must be between 6 and 15", success: false });
    }

    await db.$transaction(async (tx) => {
      const roles = assignRoles(room.players.length);

      for (let i = 0; i < room.players.length; i++) {
        const player = room.players[i];
        const role = roles[i];
        await tx.roomPlayer.update({
          where: { id: player.id },
          data: {
            role: role.role,
            team: role.team,
          },
        });
      }

      const randomIndex = Math.floor(Math.random() * room.players.length);
      const selectorId = room.players[randomIndex].id;
      await tx.roomPlayer.update({
        where: { id: selectorId },
        data: { isSelector: true },
      });

      await tx.room.update({
        where: { id: roomId },
        data: { status: RoomStatus.IN_PROGRESS },
      });

      await tx.roundRecord.create({
        data: {
          roomId,
          roundNumber: 1,
          phase: "DISCUSSION",
          selectorId,
          rejectionCount: 0,
        },
      });
    });

    const updatedRoom = await db.room.findUnique({
      where: { id: roomId },
      include: { players: true, rounds: { orderBy: { roundNumber: "desc" } } },
    });

    return reply.send({ data: updatedRoom, success: true });
  });
}
