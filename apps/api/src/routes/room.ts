import { FastifyInstance } from "fastify";
import { randomBytes } from "crypto";
import { db, RoomStatus } from "@repo/db";
import { assignRoles } from "../services/roleAssignmentService";

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

export async function registerRoomRoutes(app: FastifyInstance) {
  if (process.env.NODE_ENV !== "production") {
    app.post("/dev/create-user", async (request, reply) => {
      const { name } = request.body as { name?: string };
      const id = generateId();
      const email = `${id}@test.local`;
      const user = await db.user.create({
        data: { id, name: name || "Test User", email },
      });
      return reply.send({ data: { userId: user.id, token: id }, success: true });
    });
  }

  app.post("/room", async (request, reply) => {
    const body = request.body as { userId?: string; userName?: string };
    const userId = body.userId;

    if (!userId) {
      return reply.status(400).send({ error: "userId required", success: false });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return reply.status(404).send({ error: "User not found", success: false });
    }

    const code = await generateUniqueRoomCode();
    const room = await db.room.create({
      data: {
        code,
        hostId: userId,
        players: {
          create: {
            userId: userId,
          },
        },
      },
    });

    return reply.send({ data: { roomId: room.id, code: room.code }, success: true });
  });

  app.post("/room/:roomId/join", async (request, reply) => {
    const { roomId } = request.params as { roomId: string };
    const body = request.body as { userId?: string };
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

    if (room.status !== RoomStatus.WAITING) {
      return reply.status(400).send({ error: "Game already started", success: false });
    }

    const existingPlayer = room.players.find((p: { userId: string }) => p.userId === userId);
    if (existingPlayer) {
      return reply.send({ data: { roomId: room.id, alreadyJoined: true }, success: true });
    }

    if (room.players.length >= 15) {
      return reply.status(400).send({ error: "Room is full", success: false });
    }

    const player = await db.roomPlayer.create({
      data: {
        roomId,
        userId,
      },
    });

    return reply.send({ data: { playerId: player.id, roomId }, success: true });
  });

  app.post("/room/:roomId/start", async (request, reply) => {
    const { roomId } = request.params as { roomId: string };
    const body = request.body as { userId?: string };
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

    if (room.hostId !== userId) {
      return reply.status(403).send({ error: "Only host can start game", success: false });
    }

    if (room.players.length < 6) {
      return reply.status(400).send({ error: "Need at least 6 players", success: false });
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