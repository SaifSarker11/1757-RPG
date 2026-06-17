import { FastifyInstance } from "fastify";
import { randomBytes } from "crypto";
import { db, RoomStatus } from "@repo/db";
import { assignRoles } from "../services/roleAssignmentService.js";
import { Server } from "socket.io";

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

export async function registerRoomRoutes(app: FastifyInstance, io: Server) {
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

  app.post("/rooms/join-random", async (request, reply) => {
    const { userId } = request.body as { userId?: string };
    if (!userId || typeof userId !== "string") {
      return reply.status(400).send({ error: "userId required", success: false });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return reply.status(400).send({ error: "User not found", success: false });
    }

    const waitingRooms = await db.room.findMany({
      where: { status: "WAITING" },
      include: { players: true },
      orderBy: { createdAt: "asc" },
    });

    const roomToJoin = waitingRooms.find((r) => r.players.length < r.maxPlayers);

    if (roomToJoin) {
      const existingPlayer = roomToJoin.players.find((p) => p.userId === userId);
      if (existingPlayer) {
        return reply.send({
          roomId: roomToJoin.id,
          code: roomToJoin.code,
          status: roomToJoin.status,
          maxPlayers: roomToJoin.maxPlayers,
          hostUserId: roomToJoin.hostUserId,
        });
      }

      await db.roomPlayer.create({
        data: {
          roomId: roomToJoin.id,
          userId,
        },
      });

      return reply.send({
        roomId: roomToJoin.id,
        code: roomToJoin.code,
        status: roomToJoin.status,
        maxPlayers: roomToJoin.maxPlayers,
        hostUserId: roomToJoin.hostUserId,
      });
    }

    // No room available, create a new one!
    const code = await generateUniqueRoomCode();
    const newRoom = await db.room.create({
      data: {
        code,
        hostUserId: userId,
        maxPlayers: 10,
        status: "WAITING",
        currentRound: 0,
        players: {
          create: {
            userId,
          },
        },
      },
    });

    return reply.send({
      roomId: newRoom.id,
      code: newRoom.code,
      status: newRoom.status,
      maxPlayers: newRoom.maxPlayers,
      hostUserId: newRoom.hostUserId,
    });
  });

  app.post("/rooms/:roomId/join", async (request, reply) => {
    const { roomId } = request.params as { roomId: string };
    const body = request.body as JoinRoomBody;

    if (!body.userId || typeof body.userId !== "string") {
      return reply.status(400).send({ error: "userId required", success: false });
    }

    // Support code search too
    const room = await db.room.findFirst({
      where: {
        OR: [
          { id: roomId },
          { code: roomId.toUpperCase() }
        ]
      },
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
        roomId: room.id,
        userId: body.userId,
      },
    });

    return {
      roomId: room.id,
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

  app.post("/rooms/:roomId/kick", async (request, reply) => {
    const { roomId } = request.params as { roomId: string };
    const { userId, targetUserId } = request.body as { userId?: string; targetUserId?: string };

    if (!userId || !targetUserId) {
      return reply.status(400).send({ error: "userId and targetUserId required", success: false });
    }

    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { players: true },
    });

    if (!room) {
      return reply.status(404).send({ error: "Room not found", success: false });
    }

    if (room.hostUserId !== userId) {
      return reply.status(403).send({ error: "Only the host can kick players", success: false });
    }

    const player = room.players.find((p) => p.userId === targetUserId);
    if (!player) {
      return reply.status(404).send({ error: "Player not in room", success: false });
    }

    await db.roomPlayer.delete({ where: { id: player.id } });

    // Notify clients in the room
    io.to(roomId).emit("room:kicked", { userId: targetUserId });
    io.to(roomId).emit("game:leave", { roomId, userId: targetUserId });

    return reply.send({ success: true, roomId, kickedUserId: targetUserId });
  });

  app.post("/rooms/:roomId/promote", async (request, reply) => {
    const { roomId } = request.params as { roomId: string };
    const { userId, targetUserId } = request.body as { userId?: string; targetUserId?: string };

    if (!userId || !targetUserId) {
      return reply.status(400).send({ error: "userId and targetUserId required", success: false });
    }

    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { players: true },
    });

    if (!room) {
      return reply.status(404).send({ error: "Room not found", success: false });
    }

    if (room.hostUserId !== userId) {
      return reply.status(403).send({ error: "Only the host can promote another user", success: false });
    }

    const isTargetInRoom = room.players.some((p) => p.userId === targetUserId);
    if (!isTargetInRoom) {
      return reply.status(400).send({ error: "Target player not in room", success: false });
    }

    await db.room.update({
      where: { id: roomId },
      data: { hostUserId: targetUserId },
    });

    // Notify clients in the room
    io.to(roomId).emit("room:host-changed", { hostUserId: targetUserId });

    return reply.send({ success: true, roomId, newHostUserId: targetUserId });
  });

  if (process.env.NODE_ENV !== "production") {
    app.post("/rooms/:roomId/dev/fill-bots", async (request, reply) => {
      const { roomId } = request.params as { roomId: string };

      try {
        const room = await db.room.findUnique({
          where: { id: roomId },
          include: { players: true },
        });

        if (!room) {
          return reply.status(404).send({ error: "Room not found", success: false });
        }

        const currentCount = room.players.length;
        const neededCount = Math.max(0, 6 - currentCount);
        if (neededCount === 0) {
          return reply.send({ success: true, message: "Room already has enough players", botsAdded: 0 });
        }

        const botsAdded = [];
        for (let i = 0; i < neededCount; i++) {
          const id = `bot-${generateId()}`;
          const name = `Bot_${i + 1}`;
          const email = `${id}@bot.local`;

          const user = await db.user.create({
            data: { id, name, email, isAnonymous: true },
          });

          await db.roomPlayer.create({
            data: {
              roomId,
              userId: user.id,
            },
          });

          botsAdded.push({ userId: user.id, username: name });
        }

        // Trigger socket events for bots joining and delayed messages
        botsAdded.forEach((bot, index) => {
          io.to(roomId).emit("game:join", { roomId, userId: bot.userId });

          setTimeout(() => {
            const message = {
              id: Math.random().toString(36).substring(2, 11),
              username: bot.username,
              text: `hi, I am ${bot.username}! Ready to start!`,
              timestamp: new Date().toISOString(),
            };
            io.to(roomId).emit("chat:message", message);
          }, (index + 1) * 3000 + 4000); // Send message after 7s, 10s, 13s, etc.
        });

        return reply.send({ success: true, botsAdded });
      } catch (error) {
        request.log.error(error, "Error filling bots");
        return reply.status(500).send({
          error: error instanceof Error ? error.message : "Failed to fill bots",
          success: false,
        });
      }
    });
  }

  app.get("/rooms/:roomId", async (request, reply) => {
    const { roomId } = request.params as { roomId: string };

    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { players: { include: { user: true } } },
    });

    if (!room) {
      return reply.status(404).send({ error: "Room not found", success: false });
    }

    return {
      id: room.id,
      code: room.code,
      hostUserId: room.hostUserId,
      status: room.status,
      maxPlayers: room.maxPlayers,
      currentRound: room.currentRound,
      greenWins: room.greenWins,
      redWins: room.redWins,
      players: room.players.map((p) => ({
        userId: p.userId,
        username: p.user?.name || "Guest",
        team: p.team,
        isSelector: p.isSelector,
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
