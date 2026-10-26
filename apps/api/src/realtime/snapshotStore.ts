import type { Redis } from "ioredis";
import type { GameState } from "@repo/game-engine";
import type { PlayerIdentity } from "../persistence/matchRecord.js";

export const SNAPSHOT_VERSION = 1;
/** Plan §5: snapshots live 2 h; every save refreshes the TTL. */
export const SNAPSHOT_TTL_SECONDS = 2 * 60 * 60;
const KEY_PREFIX = "game:";

/** Everything needed to resume a match after a restart. */
export interface GameSnapshot {
  version: typeof SNAPSHOT_VERSION;
  roomId: string;
  roomCode: string;
  /** RNG for step n is `createRng(seed + n)`, so it is reproducible after a restart. */
  seed: number;
  step: number;
  startedAt: number;
  /** Engine player id → stored identity (guests have no user row). */
  identities: Record<string, PlayerIdentity>;
  /** Set once the match result has been written to Postgres. */
  savedMatchId: string | null;
  state: GameState;
}

export interface SnapshotStore {
  save(snapshot: GameSnapshot): Promise<void>;
  load(roomId: string): Promise<GameSnapshot | null>;
  delete(roomId: string): Promise<void>;
  list(): Promise<GameSnapshot[]>;
}

export function snapshotKey(roomId: string): string {
  return `${KEY_PREFIX}${roomId}`;
}

function decode(raw: string | null): GameSnapshot | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      typeof value === "object" &&
      value !== null &&
      "version" in value &&
      value.version === SNAPSHOT_VERSION
    ) {
      return value as GameSnapshot;
    }
  } catch {
    // Corrupt snapshots are treated as missing.
  }
  return null;
}

type RedisLike = Pick<Redis, "set" | "get" | "del" | "scan">;

export class RedisSnapshotStore implements SnapshotStore {
  constructor(private readonly redis: RedisLike) {}

  async save(snapshot: GameSnapshot): Promise<void> {
    await this.redis.set(snapshotKey(snapshot.roomId), JSON.stringify(snapshot), "EX", SNAPSHOT_TTL_SECONDS);
  }

  async load(roomId: string): Promise<GameSnapshot | null> {
    return decode(await this.redis.get(snapshotKey(roomId)));
  }

  async delete(roomId: string): Promise<void> {
    await this.redis.del(snapshotKey(roomId));
  }

  async list(): Promise<GameSnapshot[]> {
    const snapshots: GameSnapshot[] = [];
    let cursor = "0";
    do {
      const [next, keys] = await this.redis.scan(cursor, "MATCH", `${KEY_PREFIX}*`, "COUNT", 100);
      cursor = next;
      for (const key of keys) {
        const snapshot = decode(await this.redis.get(key));
        if (snapshot) snapshots.push(snapshot);
      }
    } while (cursor !== "0");
    return snapshots;
  }
}

/** For tests and local runs without Redis. */
export class MemorySnapshotStore implements SnapshotStore {
  readonly data = new Map<string, string>();

  async save(snapshot: GameSnapshot): Promise<void> {
    this.data.set(snapshot.roomId, JSON.stringify(snapshot));
  }

  async load(roomId: string): Promise<GameSnapshot | null> {
    return decode(this.data.get(roomId) ?? null);
  }

  async delete(roomId: string): Promise<void> {
    this.data.delete(roomId);
  }

  async list(): Promise<GameSnapshot[]> {
    return [...this.data.values()].flatMap((raw) => decode(raw) ?? []);
  }
}
