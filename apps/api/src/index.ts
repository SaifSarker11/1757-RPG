import "@repo/config/load-env";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { Server } from "socket.io";
import { db } from "@repo/db";
import { registerAuthRoutes } from "./auth-routes.js";
import { registerRoomRoutes } from "./routes/rooms.js";
import { registerSocketHandlers } from "./socket/index.js";
import { resolveAuthSession } from "./lib/authSession.js";
import { createSocketNotifier } from "./lobby/notifier.js";
import { listPublicRooms, loadRoomDetail } from "./lobby/roomQueries.js";
import { createRedis } from "./lib/redis.js";
import { GameService } from "./realtime/gameService.js";
import { createLobbyCleanup } from "./realtime/lobbyCleanup.js";
import { HTTP_RATE_LIMIT } from "./realtime/rateLimit.js";
import { prismaRoomRepository } from "./realtime/roomRepository.js";
import { createTimerScheduler } from "./realtime/scheduler.js";
import {
  MemorySnapshotStore,
  RedisSnapshotStore,
  type SnapshotStore,
} from "./realtime/snapshotStore.js";
import { createSocketTransport } from "./realtime/transport.js";
import { createDisconnectTracker } from "./realtime/disconnectTracker.js";
import { registerUserRoutes } from "./users/routes.js";
import { registerAdminRoutes } from "./admin/routes.js";

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

/** Same rule for HTTP and sockets: the configured apps, plus LAN addresses in development. */
function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  return process.env.NODE_ENV !== "production" && isDevLanOrigin(origin);
}

await app.register(cors, {
  origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
});

await app.register(helmet, {
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

await app.register(rateLimit, { ...HTTP_RATE_LIMIT });

await registerAuthRoutes(app);

const io = new Server(app.server, {
  cors: {
    origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
    credentials: true,
  },
});

const logError = (error: unknown, message: string) => app.log.error(error, message);

const lobbyNotifier = createSocketNotifier(io, {
  listPublicRooms,
  loadRoom: loadRoomDetail,
  onError: (error) => logError(error, "Lobby notification failed"),
});
await registerRoomRoutes(app, { resolveSession: resolveAuthSession, notifier: lobbyNotifier });
await registerUserRoutes(app, { resolveSession: resolveAuthSession });
await registerAdminRoutes(app, { resolveSession: resolveAuthSession });

// Live games snapshot to Redis. Without Redis (local dev without Docker) they
// fall back to memory and won't survive a restart.
async function createSnapshotStore(): Promise<SnapshotStore> {
  const redis = createRedis();
  try {
    await redis.connect();
    return new RedisSnapshotStore(redis);
  } catch (error) {
    redis.disconnect();
    app.log.warn(error, "Redis unavailable: live games will not survive a restart");
    return new MemorySnapshotStore();
  }
}

const scheduler = createTimerScheduler();

const games = new GameService({
  store: await createSnapshotStore(),
  scheduler,
  repo: prismaRoomRepository,
  transport: createSocketTransport(io),
  disconnects: createDisconnectTracker({
    scheduler,
    onGraceExpired: (roomId, userId) => {
      void games.autoAct(roomId, userId);
    },
  }),
  logError,
});

const cleanup = createLobbyCleanup({
  scheduler,
  connectedCount: async (roomId) => (await io.in(roomId).fetchSockets()).length,
  deleteIfWaiting: (roomId) => prismaRoomRepository.deleteIfWaiting(roomId),
  onDeleted: () => lobbyNotifier.lobbyChanged(),
  logError,
});

registerSocketHandlers(io, {
  resolveSession: resolveAuthSession,
  games,
  repo: prismaRoomRepository,
  cleanup,
  onGameStarted: () => lobbyNotifier.lobbyChanged(),
  logError,
});

const restored = await games.restore();
if (restored > 0) app.log.info(`Restored ${restored} live game(s) from snapshots`);

app.get("/health", async (request, reply) => {
  let dbStatus = "ok";
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "error";
  }

  const isHealthy = dbStatus === "ok";
  const status = isHealthy ? 200 : 503;

  return reply.status(status).send({
    status: isHealthy ? "ok" : "degraded",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      redis: process.env.REDIS_URL ? "configured" : "memory_fallback",
    },
    memory: {
      rssMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
      heapUsedMb: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
    },
  });
});

try {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  await app.listen({ port, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Graceful shutdown — close sockets, then HTTP, then DB
// ---------------------------------------------------------------------------
async function shutdown(signal: string) {
  app.log.info(`Received ${signal}, shutting down gracefully…`);

  // Stop accepting new socket connections; disconnect existing ones
  io.close();

  // Close the Fastify HTTP server (finishes in-flight requests)
  await app.close();

  app.log.info("Shutdown complete");
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
