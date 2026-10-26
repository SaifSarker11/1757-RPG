/**
 * Token bucket: holds up to `capacity` tokens, refilled continuously so a
 * full bucket regains `capacity` tokens every `perMs`. Each event takes one.
 */
export class TokenBucket {
  private tokens: number;
  private last: number;

  constructor(
    private readonly capacity: number,
    private readonly perMs: number,
    private readonly now: () => number = Date.now
  ) {
    this.tokens = capacity;
    this.last = now();
  }

  /** Takes a token if one is available. */
  tryTake(): boolean {
    const now = this.now();
    const refill = ((now - this.last) / this.perMs) * this.capacity;
    this.tokens = Math.min(this.capacity, this.tokens + refill);
    this.last = now;
    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }
}

/** Per-socket limits (plan §5) [DEFAULT]. */
export const SOCKET_LIMITS = {
  chat: { capacity: 5, perMs: 5_000 },
  action: { capacity: 10, perMs: 1_000 },
} as const;

/** HTTP limit per IP [DEFAULT]. */
export const HTTP_RATE_LIMIT = { max: 100, timeWindow: "1 minute" } as const;

export type SocketLimitKind = keyof typeof SOCKET_LIMITS;

/** One bucket of each kind for a single socket. */
export function createSocketLimiter(now: () => number = Date.now) {
  const buckets: Record<SocketLimitKind, TokenBucket> = {
    chat: new TokenBucket(SOCKET_LIMITS.chat.capacity, SOCKET_LIMITS.chat.perMs, now),
    action: new TokenBucket(SOCKET_LIMITS.action.capacity, SOCKET_LIMITS.action.perMs, now),
  };
  return (kind: SocketLimitKind) => buckets[kind].tryTake();
}
