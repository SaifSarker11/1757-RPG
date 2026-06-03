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
import { registerRoomHandlers } from "./socket/roomHandler";

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

    // Expo Go / LAN devices in development
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
registerRoomRoutes(app);

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

    // New handler: user:identify
    socket.on("user:identify", (data: { userId: string }) => {
      if (!data || !data.userId) {
        return;
      }
      socket.data.userId = data.userId;
    });

    // New handler: game:start
    socket.on("game:start", async (data: { roomId: string; hostUserId: string }) => {
      try {
        // 1. Validate payload
        if (!data || !data.roomId || !data.hostUserId) {
          socket.emit("error", { message: "Invalid payload" });
          return;
        }

        // 2. Load room from DB
        const room = await prisma.room.findUnique({
          where: { id: data.roomId },
          include: { players: true },
        });

        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        // 3. Verify host and WAITING status
        if (room.hostId !== data.hostUserId) {
          socket.emit("error", { message: "Only the host can start the game" });
          return;
        }
        if (room.status !== "WAITING") {
          socket.emit("error", { message: "Room is not waiting for start" });
          return;
        }

        // 4. Assign roles via assignRoles
        const playerCount = room.players.length;
        if (playerCount < 6 || playerCount > 15) {
          socket.emit("error", { message: "Invalid player count" });
          return;
        }

        const userIds = room.players.map((p: { userId: string }) => p.userId);
        const assignments: IRoleAssignment[] = assignRoles(userIds, playerCount);

        // 5. Update RoomPlayer records with role/team
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

        // 6. Emit private role:assigned to each player individually
        // We need to get the updated players with their roles/teams
        const updatedRoom = await prisma.room.findUnique({
          where: { id: room.id },
          include: { players: true },
        });

        if (!updatedRoom) {
          socket.emit("error", { message: "Failed to fetch updated room" });
          return;
        }

        for (const player of updatedRoom.players) {
          // Find the socket for this player by userId
          // We need to iterate over all sockets to find the one with socket.data.userId === player.userId
          // Note: io.sockets.sockets is a Map of socketId -> Socket
          let targetSocket: Socket | null = null;
          for (const [, socket] of io.sockets.sockets) {
            if (socket.data.userId === player.userId) {
              targetSocket = socket;
              break;
            }
          }

          if (targetSocket) {
            // Convert enum role and team to our string representation
            const roleKey = Object.keys(PlayerRole).find(k => PlayerRole[k as keyof typeof PlayerRole] === player.role);
            const teamKey = Object.keys(PlayerTeam).find(k => PlayerTeam[k as keyof typeof PlayerTeam] === player.team);
            const roleString = (roleKey?.toLowerCase() ?? '') as RoleName;
            const teamString = (teamKey?.toLowerCase() ?? '') as TeamName;

            // Build private role info for this player
            // We need all assignments for the buildPrivateRoleInfo function
            // We have the assignments array from assignRoles.
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

        // 7. Update room status to IN_PROGRESS
        await prisma.room.update({
          where: { id: room.id },
          data: { status: "IN_PROGRESS" },
        });

        // 8. Emit game:started to room
        io.to(room.id).emit("game:started");

        // 9. Emit round:phase for Round 1 discussion
        // We assume the round phase emission includes the phase and the duration.
        // From the decisions.md, discussion phase is 120 seconds.
        io.to(room.id).emit("round:phase", {
          phase: "DISCUSSION",
          round: 1,
          duration: 120, // seconds
        });

        // 10. TODO comment for Prompt 4's initGameState
        // TODO: Implement initGameState for Prompt 4
       } catch (error) {
         app.log.error({err: error}, "Error in game:start handler:");
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
