import type { Server } from "socket.io";
import type { GameEvent, PlayerView } from "@repo/game-engine";
import { userChannel } from "./socketAuth.js";

/** Engine events that are safe for the whole room. */
export type PublicGameEvent = Exclude<GameEvent, { type: "PRIVATE_VIEW_CHANGED" | "ACTION_REJECTED" }>;

export function publicEvents(events: readonly GameEvent[]): PublicGameEvent[] {
  return events.filter(
    (e): e is PublicGameEvent => e.type !== "PRIVATE_VIEW_CHANGED" && e.type !== "ACTION_REJECTED"
  );
}

/** How the game service reaches clients. Never carries the full GameState. */
export interface GameTransport {
  /** A player's own projection, to their private channel only. */
  sendView(roomId: string, userId: string, view: PlayerView): void;
  /** Public events, to everyone in the room channel. */
  sendEvents(roomId: string, events: PublicGameEvent[]): void;
}

/**
 * Socket.IO transport:
 * - `game:view` → `user:<id>`: `{ roomId, view }`
 * - `game:event` → the room channel: `{ roomId, events }`
 */
export function createSocketTransport(io: Server): GameTransport {
  return {
    sendView(roomId, userId, view) {
      io.to(userChannel(userId)).emit("game:view", { roomId, view });
    },
    sendEvents(roomId, events) {
      if (events.length > 0) io.to(roomId).emit("game:event", { roomId, events });
    },
  };
}
