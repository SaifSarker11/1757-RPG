import "@repo/config/load-env";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { Server } from "socket.io";
import { registerAuthRoutes } from "./auth-routes.js";
import { registerRoomRoutes } from "./routes/rooms.js";
import { registerSocketHandlers } from "./socket/index.js";
import { resolveAuthSession } from "./lib/authSession.js";
import { createSocketNotifier } from "./lobby/notifier.js";
import { listPublicRooms, loadRoomDetail } from "./lobby/roomQueries.js";

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
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
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

registerSocketHandlers(io);

const lobbyNotifier = createSocketNotifier(io, {
  listPublicRooms,
  loadRoom: loadRoomDetail,
  onError: (error) => app.log.error(error, "Lobby notification failed"),
});
await registerRoomRoutes(app, { resolveSession: resolveAuthSession, notifier: lobbyNotifier });

app.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

try {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  await app.listen({ port, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
