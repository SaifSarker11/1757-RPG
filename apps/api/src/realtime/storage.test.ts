import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGame, createRng } from "@repo/game-engine";
import { createTimerScheduler } from "./scheduler.js";
import {
  MemorySnapshotStore,
  RedisSnapshotStore,
  SNAPSHOT_TTL_SECONDS,
  type GameSnapshot,
} from "./snapshotStore.js";

function snapshot(roomId = "r1"): GameSnapshot {
  const { state } = createGame({
    playerIds: ["a", "b", "c", "d", "e", "f"],
    now: 0,
    rng: createRng(1),
  });
  return {
    version: 1,
    roomId,
    roomCode: "AB12CD",
    seed: 42,
    step: 3,
    startedAt: 0,
    identities: {},
    savedMatchId: null,
    state,
  };
}

/** Minimal in-memory stand-in for the ioredis commands the store uses. */
function fakeRedis() {
  const data = new Map<string, string>();
  const ttls = new Map<string, number>();
  return {
    data,
    ttls,
    set: vi.fn(async (key: string, value: string, _ex: string, ttl: number) => {
      data.set(key, value);
      ttls.set(key, ttl);
      return "OK";
    }),
    get: vi.fn(async (key: string) => data.get(key) ?? null),
    del: vi.fn(async (key: string) => (data.delete(key) ? 1 : 0)),
    scan: vi.fn(async () => ["0", [...data.keys()].filter((k) => k.startsWith("game:"))]),
  };
}

describe("RedisSnapshotStore", () => {
  it("saves under game:<roomId> with a 2 h TTL and loads it back", async () => {
    const redis = fakeRedis();
    const store = new RedisSnapshotStore(redis as never);
    await store.save(snapshot());
    expect([...redis.data.keys()]).toEqual(["game:r1"]);
    expect(redis.ttls.get("game:r1")).toBe(SNAPSHOT_TTL_SECONDS);
    expect(await store.load("r1")).toEqual(snapshot());
  });

  it("lists every snapshot and ignores corrupt or old-version ones", async () => {
    const redis = fakeRedis();
    const store = new RedisSnapshotStore(redis as never);
    await store.save(snapshot("r1"));
    await store.save(snapshot("r2"));
    redis.data.set("game:broken", "{not json");
    redis.data.set("game:old", JSON.stringify({ version: 0 }));
    expect((await store.list()).map((s) => s.roomId).sort()).toEqual(["r1", "r2"]);
  });

  it("deletes", async () => {
    const redis = fakeRedis();
    const store = new RedisSnapshotStore(redis as never);
    await store.save(snapshot());
    await store.delete("r1");
    expect(await store.load("r1")).toBeNull();
  });
});

describe("MemorySnapshotStore", () => {
  it("round-trips through JSON like Redis does", async () => {
    const store = new MemorySnapshotStore();
    const original = snapshot();
    await store.save(original);
    const loaded = await store.load("r1");
    expect(loaded).toEqual(original);
    expect(loaded).not.toBe(original);
  });
});

describe("createTimerScheduler", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("runs a job at its time", () => {
    const scheduler = createTimerScheduler();
    const run = vi.fn();
    scheduler.schedule("r1", Date.now() + 1_000, run);
    vi.advanceTimersByTime(999);
    expect(run).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(run).toHaveBeenCalledOnce();
  });

  it("runs past-due jobs straight away", () => {
    const scheduler = createTimerScheduler();
    const run = vi.fn();
    scheduler.schedule("r1", Date.now() - 5_000, run);
    vi.advanceTimersByTime(0);
    expect(run).toHaveBeenCalledOnce();
  });

  it("replaces the job for a key", () => {
    const scheduler = createTimerScheduler();
    const first = vi.fn();
    const second = vi.fn();
    scheduler.schedule("r1", Date.now() + 1_000, first);
    scheduler.schedule("r1", Date.now() + 2_000, second);
    vi.advanceTimersByTime(2_000);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it("cancels one key or all", () => {
    const scheduler = createTimerScheduler();
    const a = vi.fn();
    const b = vi.fn();
    scheduler.schedule("a", Date.now() + 10, a);
    scheduler.schedule("b", Date.now() + 10, b);
    scheduler.cancel("a");
    vi.advanceTimersByTime(10);
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledOnce();

    scheduler.schedule("a", Date.now() + 10, a);
    scheduler.cancelAll();
    vi.advanceTimersByTime(10);
    expect(a).not.toHaveBeenCalled();
  });
});
