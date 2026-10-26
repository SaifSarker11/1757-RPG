import type { Scheduler } from "./scheduler.js";

/** Plan M7: players get 30 s to reconnect before the server acts on their behalf. */
export const DISCONNECT_GRACE_MS = 30_000;

export interface DisconnectTrackerDeps {
  scheduler: Scheduler;
  /** Called when a player's grace period expires without a reconnect. */
  onGraceExpired(roomId: string, userId: string): void;
  now?: () => number;
  graceMs?: number;
}

const key = (roomId: string, userId: string) => `disconnect:${roomId}:${userId}`;

/**
 * Tracks which players in a live game are currently disconnected.
 *
 * When a player disconnects a countdown starts; if they reconnect before
 * it fires, the timer is cancelled and nothing changes. If they don't,
 * `onGraceExpired` fires so the game service can auto-act for them.
 */
export function createDisconnectTracker(deps: DisconnectTrackerDeps) {
  const now = deps.now ?? Date.now;
  const graceMs = deps.graceMs ?? DISCONNECT_GRACE_MS;

  /** roomId → Set of disconnected userIds */
  const offline = new Map<string, Set<string>>();

  function offlineSet(roomId: string): Set<string> {
    let set = offline.get(roomId);
    if (!set) {
      set = new Set();
      offline.set(roomId, set);
    }
    return set;
  }

  return {
    /** Mark a player as disconnected and start the grace-period timer. */
    playerLeft(roomId: string, userId: string): void {
      offlineSet(roomId).add(userId);
      deps.scheduler.schedule(key(roomId, userId), now() + graceMs, () => {
        if (offlineSet(roomId).has(userId)) {
          deps.onGraceExpired(roomId, userId);
        }
      });
    },

    /** Mark a player as reconnected and cancel any pending grace timer. */
    playerReturned(roomId: string, userId: string): void {
      offlineSet(roomId).delete(userId);
      deps.scheduler.cancel(key(roomId, userId));
    },

    /** True if the player is currently considered offline in this room. */
    isOffline(roomId: string, userId: string): boolean {
      return offlineSet(roomId).has(userId);
    },

    /** All userIds currently offline in a room. */
    offlineUsers(roomId: string): ReadonlySet<string> {
      return offline.get(roomId) ?? new Set();
    },

    /** Remove all tracking for a room (game ended / room deleted). */
    clearRoom(roomId: string): void {
      const set = offline.get(roomId);
      if (set) {
        for (const userId of set) {
          deps.scheduler.cancel(key(roomId, userId));
        }
      }
      offline.delete(roomId);
    },
  };
}

export type DisconnectTracker = ReturnType<typeof createDisconnectTracker>;
