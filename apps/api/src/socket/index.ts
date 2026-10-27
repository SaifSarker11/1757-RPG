import type { Server, Socket } from "socket.io";
import type { z } from "zod";
import type { SessionResolver, SessionUser } from "../lib/session.js";
import type { GameService } from "../realtime/gameService.js";
import type { LobbyCleanup } from "../realtime/lobbyCleanup.js";
import { createSocketLimiter, type SocketLimitKind } from "../realtime/rateLimit.js";
import type { GameRoomRepository } from "../realtime/roomRepository.js";
import {
  gameActionPayload,
  realtimeError,
  roomRefPayload,
  type RealtimeError,
} from "../realtime/schemas.js";
import { createSocketAuth, socketUser } from "../realtime/socketAuth.js";

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: string;
}

const chatHistory: ChatMessage[] = [];
const roomChatHistories = new Map<string, ChatMessage[]>();
const MAX_HISTORY = 100;

export interface SocketDeps {
  resolveSession: SessionResolver;
  games: GameService;
  repo: Pick<GameRoomRepository, "isMember">;
  cleanup: LobbyCleanup;
  /** A room left the lobby (e.g. so the public list can refresh). */
  onGameStarted?: (roomId: string) => void;
  logError?: (error: unknown, message: string) => void;
}

interface SocketState {
  roomId?: string | null;
}

const stateOf = (socket: Socket) => socket.data as SocketState;

type Ack = (result: { ok: true } | { ok: false; error: RealtimeError }) => void;

export function registerSocketHandlers(io: Server, deps: SocketDeps): void {
  io.use(createSocketAuth(deps.resolveSession));

  io.on("connection", (socket: Socket) => {
    const allow = createSocketLimiter();

    // Auto join lobby room for global chat scoping
    socket.join("lobby");

    // Send chat history upon connection
    socket.emit("chat:history", chatHistory);

    /**
     * Registers a room/game handler: rate-limited, signed-in only, payload
     * validated. Errors go to this socket only, as `game:error` and the ack.
     */
    function handle<T>(
      event: string,
      schema: z.ZodType<T>,
      kind: SocketLimitKind,
      run: (user: SessionUser, data: T) => Promise<RealtimeError | null>
    ) {
      socket.on(event, async (raw: unknown, ack?: unknown) => {
        const reply = (error: RealtimeError | null) => {
          if (error) socket.emit("game:error", error);
          if (typeof ack === "function") (ack as Ack)(error ? { ok: false, error } : { ok: true });
        };

        if (!allow(kind)) return reply(realtimeError("RATE_LIMITED"));
        const user = socketUser(socket);
        if (!user) return reply(realtimeError("UNAUTHORIZED"));
        const parsed = schema.safeParse(raw);
        if (!parsed.success) return reply(realtimeError("INVALID_PAYLOAD"));

        try {
          reply(await run(user, parsed.data));
        } catch (error) {
          deps.logError?.(error, `Socket handler ${event} failed`);
          reply(realtimeError("INTERNAL"));
        }
      });
    }

    async function onlineUserIds(roomId: string): Promise<string[]> {
      const sockets = await io.in(roomId).fetchSockets();
      return sockets.flatMap((s) => {
        const id = socketUser(s)?.id;
        return id ? [id] : [];
      });
    }

    // --- Chat (owned by the auth & chat module; behaviour unchanged) ----------

    socket.on("chat:send-message", (data: { roomId?: string; userId: string; username: string; text: string }) => {
      if (!allow("chat")) {
        socket.emit("game:error", realtimeError("RATE_LIMITED"));
        return;
      }
      if (!data || typeof data.text !== "string" || !data.username || !data.userId) {
        return;
      }

      const message: ChatMessage = {
        id: Math.random().toString(36).substring(2, 11),
        userId: data.userId,
        username: data.username,
        text: data.text,
        timestamp: new Date().toISOString(),
      };

      const targetRoom = data.roomId ?? "lobby";

      if (targetRoom === "lobby") {
        chatHistory.push(message);
        if (chatHistory.length > MAX_HISTORY) {
          chatHistory.shift();
        }
      } else {
        if (!roomChatHistories.has(targetRoom)) {
          roomChatHistories.set(targetRoom, []);
        }
        const history = roomChatHistories.get(targetRoom)!;
        history.push(message);
        if (history.length > MAX_HISTORY) {
          history.shift();
        }
      }

      io.to(targetRoom).emit("chat:message", message);
    });

    // --- Room channel ------------------------------------------------------------

    handle("room:join", roomRefPayload, "action", async (user, { roomId }) => {
      const member = deps.games.isPlayer(roomId, user.id) || (await deps.repo.isMember(roomId, user.id));
      if (!member) return realtimeError("NOT_IN_ROOM");

      socket.leave("lobby");
      await socket.join(roomId);
      stateOf(socket).roomId = roomId;
      deps.cleanup.roomOccupied(roomId);

      socket.emit("chat:history", roomChatHistories.get(roomId) ?? []);
      io.to(roomId).emit("game:join", { roomId, userId: user.id });
      io.to(roomId).emit("player:status", { userId: user.id, online: true });
      socket.emit("room:online-list", await onlineUserIds(roomId));

      // M7: cancel any pending disconnect grace timer on reconnect.
      deps.games.playerReconnected(roomId, user.id);

      // Rejoining a running match: send this player their view straight away.
      if (deps.games.hasGame(roomId)) await deps.games.sync(roomId, user.id);
      return null;
    });

    handle("room:leave", roomRefPayload, "action", async (user, { roomId }) => {
      await socket.leave(roomId);
      await socket.join("lobby");
      if (stateOf(socket).roomId === roomId) stateOf(socket).roomId = null;
      io.to(roomId).emit("game:leave", { roomId, userId: user.id });
      io.to(roomId).emit("player:status", { userId: user.id, online: false });
      await deps.cleanup.roomMaybeEmpty(roomId);
      return null;
    });

    // --- Game ----------------------------------------------------------------------

    handle("game:start", roomRefPayload, "action", async (user, { roomId }) => {
      const error = await deps.games.start(roomId, user.id);
      if (!error) {
        io.to(roomId).emit("game:started", { roomId });
        deps.onGameStarted?.(roomId);
      }
      return error;
    });

    handle("game:action", gameActionPayload, "action", (user, { roomId, action }) =>
      deps.games.act(roomId, user.id, action)
    );

    handle("game:skip", roomRefPayload, "action", (user, { roomId }) =>
      deps.games.skip(roomId, user.id)
    );

    handle("game:sync", roomRefPayload, "action", async (user, { roomId }) => {
      // M7: treat an explicit sync as a reconnect signal.
      deps.games.playerReconnected(roomId, user.id);
      return deps.games.sync(roomId, user.id);
    });

    socket.on("disconnect", () => {
      const roomId = stateOf(socket).roomId;
      const user = socketUser(socket);
      if (roomId && user) {
        io.to(roomId).emit("player:status", { userId: user.id, online: false });
        // M7: start the grace-period timer for auto-action.
        deps.games.playerDisconnected(roomId, user.id);
      }
      if (roomId) {
        deps.cleanup.roomMaybeEmpty(roomId).catch((error: unknown) => {
          deps.logError?.(error, `Lobby cleanup check for ${roomId} failed`);
        });
      }
    });
  });
}
