import "@repo/config/load-env";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { Server, Socket } from "socket.io";
import { registerAuthRoutes } from "./auth-routes";
import { registerRoomRoutes } from "./routes/rooms.js";
import { registerRoomHandlers } from "./socket/roomHandler";

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
});

try {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  await app.listen({ port, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
