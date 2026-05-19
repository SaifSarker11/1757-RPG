import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { Server, Socket } from "socket.io";

const app = Fastify({ logger: true });

await app.register(cors, { origin: "*" });
await app.register(helmet);

// Health check — this is your "Hello World"
app.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// Socket.IO
const io = new Server(app.server, {
  cors: { origin: "*" }
});

io.on("connection", (socket: Socket) => {
  app.log.info(`Socket connected: ${socket.id}`);

  socket.on("chat:message", (data: any) => {
    io.to(data.roomId).emit("chat:message", data);
  });

  socket.on("disconnect", () => {
    app.log.info(`Socket disconnected: ${socket.id}`);
  });
});

// Start
try {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  await app.listen({ port, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}