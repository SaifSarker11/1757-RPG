import type { Scheduler } from "./scheduler.js";

/** Plan §5: a lobby with nobody connected is deleted after 10 minutes. */
export const EMPTY_LOBBY_TTL_MS = 10 * 60 * 1000;

export interface LobbyCleanupDeps {
  scheduler: Scheduler;
  /** Connected sockets currently in the room channel. */
  connectedCount(roomId: string): Promise<number>;
  /** Deletes the room only if it is still WAITING; true if deleted. */
  deleteIfWaiting(roomId: string): Promise<boolean>;
  onDeleted(roomId: string): void;
  now?: () => number;
  delayMs?: number;
  logError?: (error: unknown, message: string) => void;
}

const key = (roomId: string) => `lobby-empty:${roomId}`;

/**
 * Watches lobbies that lost their last connection. Players who close the tab
 * without leaving would otherwise keep a room alive forever.
 */
export function createLobbyCleanup(deps: LobbyCleanupDeps) {
  const now = deps.now ?? Date.now;
  const delay = deps.delayMs ?? EMPTY_LOBBY_TTL_MS;

  async function sweep(roomId: string) {
    try {
      if ((await deps.connectedCount(roomId)) > 0) return;
      if (await deps.deleteIfWaiting(roomId)) deps.onDeleted(roomId);
    } catch (error) {
      deps.logError?.(error, `Cleaning up lobby ${roomId} failed`);
    }
  }

  return {
    /** Someone left or disconnected: start the countdown if the room is now empty. */
    async roomMaybeEmpty(roomId: string): Promise<void> {
      if ((await deps.connectedCount(roomId)) > 0) return;
      deps.scheduler.schedule(key(roomId), now() + delay, () => {
        void sweep(roomId);
      });
    },
    /** Someone is back: stop the countdown. */
    roomOccupied(roomId: string): void {
      deps.scheduler.cancel(key(roomId));
    },
  };
}

export type LobbyCleanup = ReturnType<typeof createLobbyCleanup>;
