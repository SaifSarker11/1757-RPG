import "@repo/config/load-env";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { Server, Socket } from "socket.io";
import { db } from "@repo/db";
import { PlayerRole, PlayerTeam } from "@repo/db";
import type { Prisma } from "@repo/db";
import { assignRoles, buildPrivateRoleInfo } from "./game/roleAssignment";
import { RoleName, TeamName, IRoleAssignment } from "@repo/types";
import { registerAuthRoutes } from "./auth-routes";
import { registerRoomRoutes } from "./routes/rooms.js";
import { registerRoomHandlers } from "./socket/roomHandler.js";
import {
  initGameState,
  startDiscussionPhase,
  handleTeamProposal,
  handleApprovalVote,
  handleMissionVote,
  handleEndgameGuess,
  handleDebussyLockOn,
  handleJeanLawLock,
} from "./game/roundEngine.js";

const prisma = db;

const app = Fastify({ logger: true });

const allowedOrigins = [
  process.env.WEB_URL ?? "http://localhost:3000",
  process.env.ADMIN_URL ?? "http://localhost:3002",
];

function isDevLanOrigin(origin: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(
    origin
  );
}

await app.register(cors, {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    if (process.env.NODE_ENV !== "production" && isDevLanOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
});

await app.register(helmet, {
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

await registerAuthRoutes(app);

const io = new Server(app.server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

registerRoomHandlers(io);
registerRoomRoutes(app, io);

app.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// ... rest of the socket handlers follow

interface ChatMessage {
  id: string;
  username: string;
  text: string;
  timestamp: string;
}

const chatHistory: ChatMessage[] = [];
const MAX_HISTORY = 100;

io.on("connection", (socket: Socket) => {
    app.log.info(`Socket connected: ${socket.id}`);

    // Send current chat history to the newly connected user
    socket.emit("chat:history", chatHistory);

    // Listen for new messages and broadcast them
    socket.on("chat:send-message", (data: { username: string; text: string }) => {
      if (!data || typeof data.text !== "string" || !data.username) {
        return;
      }

      const message: ChatMessage = {
        id: Math.random().toString(36).substring(2, 11),
        username: data.username,
        text: data.text,
        timestamp: new Date().toISOString(),
      };

      chatHistory.push(message);
      if (chatHistory.length > MAX_HISTORY) {
        chatHistory.shift();
      }

      io.emit("chat:message", message);
    });

    socket.on("disconnect", () => {
      app.log.info(`Socket disconnected: ${socket.id}`);
    });

    socket.on("user:identify", (data: { userId: string }) => {
      if (!data || !data.userId) {
        return;
      }
      socket.data.userId = data.userId;
    });

    socket.on("game:start", async (data: { roomId: string; hostUserId: string }) => {
      try {
        if (!data || !data.roomId || !data.hostUserId) {
          socket.emit("error", { message: "Invalid payload" });
          return;
        }

        const room = await prisma.room.findUnique({
          where: { id: data.roomId },
          include: { players: true },
        });

        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        if (room.hostUserId !== data.hostUserId) {
          socket.emit("error", { message: "Only the host can start the game" });
          return;
        }
        if (room.status !== "WAITING") {
          socket.emit("error", { message: "Room is not waiting for start" });
          return;
        }

        const playerCount = room.players.length;
        if (playerCount < 6 || playerCount > 15) {
          socket.emit("error", { message: "Invalid player count" });
          return;
        }

        const userIds = room.players.map((p: { userId: string }) => p.userId);
        const assignments: IRoleAssignment[] = assignRoles(userIds, playerCount);

        await prisma.$transaction(
          assignments.map((assignment) =>
            prisma.roomPlayer.updateMany({
              where: {
                roomId: room.id,
                userId: assignment.userId,
              },
              data: {
                role: PlayerRole[assignment.role.toUpperCase() as keyof typeof PlayerRole],
                team: PlayerTeam[assignment.team.toUpperCase() as keyof typeof PlayerTeam],
              }
            })
          )
        );

        const updatedRoom = await prisma.room.findUnique({
          where: { id: room.id },
          include: { players: true },
        });

        if (!updatedRoom) {
          socket.emit("error", { message: "Failed to fetch updated room" });
          return;
        }

        for (const player of updatedRoom.players) {
          let targetSocket: Socket | null = null;
          for (const [, s] of io.sockets.sockets) {
            if ((s as Socket & { data: { userId?: string } }).data.userId === player.userId) {
              targetSocket = s as Socket;
              break;
            }
          }

          if (targetSocket) {
            const roleKey = Object.keys(PlayerRole).find(k => PlayerRole[k as keyof typeof PlayerRole] === player.role);
            const teamKey = Object.keys(PlayerTeam).find(k => PlayerTeam[k as keyof typeof PlayerTeam] === player.team);
            const roleString = (roleKey?.toLowerCase() ?? '') as RoleName;
            const teamString = (teamKey?.toLowerCase() ?? '') as TeamName;

            const privateInfo = buildPrivateRoleInfo(
              {
                userId: player.userId,
                role: roleString,
                team: teamString,
              },
              assignments
            );

            targetSocket.emit("role:assigned", privateInfo);
          }
        }

        await prisma.room.update({
          where: { id: room.id },
          data: { status: "IN_PROGRESS" },
        });

        io.to(room.id).emit("game:started");

        const firstSelectorId = userIds[Math.floor(Math.random() * userIds.length)];
        await initGameState(room.id, userIds, firstSelectorId);

        await startDiscussionPhase(room.id, io);

        await socket.emit("game:started");
      } catch (error) {
        app.log.error({ err: error }, "Error in game:start handler:");
        socket.emit("error", { message: "Internal server error" });
      }
    });

    socket.on("round:proposeTeam", async (data: { roomId: string; selectorId: string; playerIds: string[] }) => {
      try {
        if (!data || !data.roomId || !data.selectorId || !Array.isArray(data.playerIds)) {
          socket.emit("error", { message: "Invalid team proposal payload" });
          return;
        }
        await handleTeamProposal(data.roomId, data.selectorId, data.playerIds, io);
      } catch (error) {
        app.log.error({ err: error }, "Error in round:proposeTeam handler:");
        socket.emit("error", { message: "Internal server error" });
      }
    });

    socket.on("round:approvalVote", async (data: { roomId: string; userId: string; vote: "approve" | "reject" }) => {
      try {
        if (!data || !data.roomId || !data.userId || !data.vote) {
          socket.emit("error", { message: "Invalid approval vote payload" });
          return;
        }
        const userId = (socket.data as { userId?: string }).userId ?? data.userId;
        await handleApprovalVote(data.roomId, userId, data.vote, io);
      } catch (error) {
        app.log.error({ err: error }, "Error in round:approvalVote handler:");
        socket.emit("error", { message: "Internal server error" });
      }
    });

    socket.on("round:missionVote", async (data: { roomId: string; userId: string; vote: "green" | "red" }) => {
      try {
        if (!data || !data.roomId || !data.userId || !data.vote) {
          socket.emit("error", { message: "Invalid mission vote payload" });
          return;
        }
        const userId = (socket.data as { userId?: string }).userId ?? data.userId;
        await handleMissionVote(data.roomId, userId, data.vote, io);
      } catch (error) {
        app.log.error({ err: error }, "Error in round:missionVote handler:");
        socket.emit("error", { message: "Internal server error" });
      }
    });

    socket.on("endgame:guess", async (data: { roomId: string; userId: string; targetUserId: string; guessType: "team" | "role" }) => {
      try {
        if (!data || !data.roomId || !data.userId || !data.targetUserId || !data.guessType) {
          socket.emit("error", { message: "Invalid endgame guess payload" });
          return;
        }
        const userId = (socket.data as { userId?: string }).userId ?? data.userId;
        await handleEndgameGuess(data.roomId, userId, data.targetUserId, data.guessType, io);
      } catch (error) {
        app.log.error({ err: error }, "Error in endgame:guess handler:");
        socket.emit("error", { message: "Internal server error" });
      }
    });

    socket.on("debussy:lockOn", async (data: { roomId: string; userId: string; targetUserId: string }) => {
      try {
        if (!data || !data.roomId || !data.userId || !data.targetUserId) {
          socket.emit("error", { message: "Invalid debussy lock payload" });
          return;
        }
        const userId = (socket.data as { userId?: string }).userId ?? data.userId;
        await handleDebussyLockOn(data.roomId, userId, data.targetUserId, io);
      } catch (error) {
        app.log.error({ err: error }, "Error in debussy:lockOn handler:");
        socket.emit("error", { message: "Internal server error" });
      }
    });

    socket.on("jeanlaw:lock", async (data: { roomId: string; userId: string; targetUserId: string }) => {
      try {
        if (!data || !data.roomId || !data.userId || !data.targetUserId) {
          socket.emit("error", { message: "Invalid jean law lock payload" });
          return;
        }
        const userId = (socket.data as { userId?: string }).userId ?? data.userId;
        await handleJeanLawLock(data.roomId, userId, data.targetUserId, io);
      } catch (error) {
        app.log.error({ err: error }, "Error in jeanlaw:lock handler:");
        socket.emit("error", { message: "Internal server error" });
      }
    });
  });

try {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  await app.listen({ port, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

