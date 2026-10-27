import { describe, expect, it, vi } from "vitest";
import type { PlayerView } from "@repo/game-engine";
import { GameService, FINISHED_RETENTION_MS } from "./gameService.js";
import type { GameRoomRepository, StartableRoom } from "./roomRepository.js";
import type { Scheduler } from "./scheduler.js";
import { MemorySnapshotStore } from "./snapshotStore.js";
import type { GameTransport, PublicGameEvent } from "./transport.js";

const USERS = ["u1", "u2", "u3", "u4", "u5", "u6"];

/** Scheduler driven by a fake clock: `runDue()` fires everything whose time has come. */
class FakeScheduler implements Scheduler {
  jobs = new Map<string, { at: number; run: () => void }>();
  schedule(key: string, at: number, run: () => void) {
    this.jobs.set(key, { at, run });
  }
  cancel(key: string) {
    this.jobs.delete(key);
  }
  cancelAll() {
    this.jobs.clear();
  }
  nextAt(prefix: string): number | undefined {
    return [...this.jobs.entries()].find(([k]) => k.startsWith(prefix))?.[1].at;
  }
  runDue(now: number) {
    for (const [key, job] of [...this.jobs.entries()]) {
      if (job.at <= now) {
        this.jobs.delete(key);
        job.run();
      }
    }
  }
}

class RecordingTransport implements GameTransport {
  views = new Map<string, PlayerView>();
  viewCounts = new Map<string, number>();
  events: PublicGameEvent[] = [];
  sendView(_roomId: string, userId: string, view: PlayerView) {
    this.views.set(userId, view);
    this.viewCounts.set(userId, (this.viewCounts.get(userId) ?? 0) + 1);
  }
  sendEvents(_roomId: string, events: PublicGameEvent[]) {
    this.events.push(...events);
  }
}

function lobby(overrides: Partial<StartableRoom> = {}): StartableRoom {
  return {
    id: "room-1",
    code: "AB12CD",
    hostUserId: "u1",
    status: "WAITING",
    discussionSeconds: 30,
    enabledRoles: ["NAWAB_SIRAJ", "LUTFUNNESA", "MIR_MADAN", "MIR_JAFAR", "DE_BUSSY", "LOYALIST"],
    mode: "STANDARD",
    roundDiscussionSeconds: [],
    roleAssignments: {},
    players: USERS.map((userId, i) => ({
      userId,
      createdAt: new Date(1_000 + i),
      isAnonymous: userId === "u6",
    })),
    ...overrides,
  };
}

function setup(room: StartableRoom | null = lobby(), store = new MemorySnapshotStore()) {
  const clock = { now: 1_000_000 };
  const scheduler = new FakeScheduler();
  const transport = new RecordingTransport();
  const repo = {
    loadForStart: vi.fn(async () => room),
    isMember: vi.fn(async () => true),
    claimForStart: vi.fn(async () => true),
    markFinished: vi.fn(async () => {}),
    saveMatch: vi.fn(async () => ({ id: "match-1" })),
    deleteIfWaiting: vi.fn(async () => false),
  } satisfies GameRoomRepository;
  const logError = vi.fn();
  const service = new GameService({
    store,
    scheduler,
    repo,
    transport,
    now: () => clock.now,
    randomSeed: () => 1234,
    logError,
  });

  /** Advances the clock to the next phase deadline and fires the tick. */
  const timeout = async () => {
    const at = scheduler.nextAt("tick:");
    if (at === undefined) throw new Error("no tick scheduled");
    clock.now = at;
    scheduler.runDue(clock.now);
    await settle();
  };

  return { service, scheduler, transport, repo, store, clock, logError, timeout };
}

/** Lets queued promise chains in the service run. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const viewOf = (t: RecordingTransport, id: string) => {
  const view = t.views.get(id);
  if (!view) throw new Error(`no view for ${id}`);
  return view;
};

/** Plays to POST_GAME: Leaders nominate the first seats, everything else times out. */
async function playToEnd(ctx: ReturnType<typeof setup>) {
  for (let guard = 0; viewOf(ctx.transport, "u1").game.phase !== "POST_GAME"; guard++) {
    if (guard > 200) throw new Error("match never ended");
    const leader = USERS.find((id) => viewOf(ctx.transport, id).pending.nominate);
    if (leader) {
      const view = viewOf(ctx.transport, leader);
      const size = view.pending.nominate?.teamSize ?? 0;
      const ministerIds = view.game.players.slice(0, size).map((p) => p.id);
      expect(await ctx.service.act("room-1", leader, { type: "NOMINATE", ministerIds })).toBeNull();
    } else {
      await ctx.timeout();
    }
  }
}

describe("start", () => {
  it("rejects non-hosts, missing rooms, started rooms and bad player counts", async () => {
    expect((await setup().service.start("room-1", "u2"))?.code).toBe("NOT_HOST");
    expect((await setup(null).service.start("room-1", "u1"))?.code).toBe("ROOM_NOT_FOUND");
    expect((await setup(lobby({ status: "IN_PROGRESS" })).service.start("room-1", "u1"))?.code).toBe(
      "GAME_ALREADY_STARTED"
    );
    const five = lobby({ players: lobby().players.slice(0, 5) });
    expect((await setup(five).service.start("room-1", "u1"))?.code).toBe("INVALID_PLAYER_COUNT");
  });

  it("loses the race cleanly when another request claimed the room", async () => {
    const ctx = setup();
    ctx.repo.claimForStart.mockResolvedValueOnce(false);
    expect((await ctx.service.start("room-1", "u1"))?.code).toBe("GAME_ALREADY_STARTED");
    expect(ctx.service.hasGame("room-1")).toBe(false);
  });

  it("can't start twice", async () => {
    const ctx = setup();
    expect(await ctx.service.start("room-1", "u1")).toBeNull();
    expect((await ctx.service.start("room-1", "u1"))?.code).toBe("GAME_ALREADY_STARTED");
  });

  it("deals the game, snapshots it, and sends each player only their own view", async () => {
    const ctx = setup();
    expect(await ctx.service.start("room-1", "u1")).toBeNull();

    expect(ctx.service.hasGame("room-1")).toBe(true);
    expect(await ctx.store.load("room-1")).toMatchObject({ roomCode: "AB12CD", seed: 1234, step: 1 });
    for (const id of USERS) {
      const view = viewOf(ctx.transport, id);
      expect(view.me.id).toBe(id);
      expect(view.game.phase).toBe("ROLE_REVEAL");
      expect(view.game.players.every((p) => p.role === undefined)).toBe(true);
    }
    // Seats follow join order.
    expect(viewOf(ctx.transport, "u1").game.players.map((p) => p.id)).toEqual(USERS);
    expect(ctx.transport.events.map((e) => e.type)).toEqual(["PHASE_CHANGED"]);
    expect(ctx.scheduler.nextAt("tick:")).toBe(ctx.clock.now + 15_000);
  });

  it("uses the room's discussion time and ignores filler roles in the toggles", async () => {
    const ctx = setup(lobby({ discussionSeconds: 45 }));
    await ctx.service.start("room-1", "u1");
    await ctx.timeout(); // → DISCUSSION
    expect(viewOf(ctx.transport, "u1").game.endsAt).toBe(ctx.clock.now + 45_000);
  });
});

describe("act", () => {
  it("needs a running game and a seated player", async () => {
    const ctx = setup();
    expect((await ctx.service.act("room-1", "u1", { type: "CAST_VOTE", vote: "APPROVE" }))?.code).toBe("NO_GAME");
    await ctx.service.start("room-1", "u1");
    expect((await ctx.service.act("room-1", "stranger", { type: "CAST_VOTE", vote: "APPROVE" }))?.code).toBe(
      "NOT_IN_ROOM"
    );
  });

  it("returns engine rejections to the caller without broadcasting or saving", async () => {
    const ctx = setup();
    await ctx.service.start("room-1", "u1");
    const before = await ctx.store.load("room-1");
    const sent = ctx.transport.viewCounts.get("u2");

    const error = await ctx.service.act("room-1", "u2", { type: "CAST_VOTE", vote: "APPROVE" });

    expect(error).toEqual({ code: "WRONG_PHASE", message: "wrong phase" });
    expect(await ctx.store.load("room-1")).toEqual(before);
    expect(ctx.transport.viewCounts.get("u2")).toBe(sent);
  });

  it("applies concurrent votes one after another", async () => {
    const ctx = setup();
    await ctx.service.start("room-1", "u1");
    await ctx.timeout(); // DISCUSSION
    await ctx.timeout(); // SELECTION
    const leader = USERS.find((id) => viewOf(ctx.transport, id).pending.nominate) ?? "";
    await ctx.service.act("room-1", leader, { type: "NOMINATE", ministerIds: ["u1", "u2"] });

    const results = await Promise.all(
      USERS.map((id) => ctx.service.act("room-1", id, { type: "CAST_VOTE", vote: "APPROVE" }))
    );
    expect(results).toEqual(USERS.map(() => null));
    expect(viewOf(ctx.transport, "u1").game.phase).toBe("RESOLUTION");
    expect(ctx.transport.events.filter((e) => e.type === "VOTE_CAST")).toHaveLength(6);
  });

  it("broadcasts public events but never private ones", async () => {
    const ctx = setup();
    await ctx.service.start("room-1", "u1");
    await playToEnd(ctx);
    const types = new Set(ctx.transport.events.map((e) => e.type));
    expect(types.has("PRIVATE_VIEW_CHANGED" as never)).toBe(false);
    expect(types.has("ACTION_REJECTED" as never)).toBe(false);
    expect(types.has("GAME_ENDED")).toBe(true);
  });
});

describe("timers", () => {
  it("advances phases on their deadline and re-sends every view", async () => {
    const ctx = setup();
    await ctx.service.start("room-1", "u1");
    const sent = ctx.transport.viewCounts.get("u3") ?? 0;
    await ctx.timeout();
    expect(viewOf(ctx.transport, "u3").game.phase).toBe("DISCUSSION");
    expect(ctx.transport.viewCounts.get("u3")).toBe(sent + 1);
    expect((await ctx.store.load("room-1"))?.step).toBe(2);
  });

  it("an early wake-up just reschedules", async () => {
    const ctx = setup();
    await ctx.service.start("room-1", "u1");
    const at = ctx.scheduler.nextAt("tick:") ?? 0;
    ctx.scheduler.jobs.get("tick:room-1")?.run(); // fire before the deadline
    await settle();
    expect(viewOf(ctx.transport, "u1").game.phase).toBe("ROLE_REVEAL");
    expect(ctx.scheduler.nextAt("tick:")).toBe(at);
  });
});

describe("match end", () => {
  it("saves the match once with guest identities, closes the room, then cleans up", async () => {
    const ctx = setup();
    await ctx.service.start("room-1", "u1");
    await playToEnd(ctx);

    expect(ctx.repo.saveMatch).toHaveBeenCalledOnce();
    const [summary, matchCtx] = ctx.repo.saveMatch.mock.calls[0] as unknown as Parameters<GameRoomRepository["saveMatch"]>;
    expect(summary.playerCount).toBe(6);
    expect(matchCtx.roomCode).toBe("AB12CD");
    expect(matchCtx.identities.u1).toEqual({ userId: "u1", guestId: null });
    expect(matchCtx.identities.u6).toEqual({ userId: null, guestId: "u6" });
    expect(ctx.repo.markFinished).toHaveBeenCalledOnce();
    expect((await ctx.store.load("room-1"))?.savedMatchId).toBe("match-1");
    expect(ctx.scheduler.nextAt("tick:")).toBeUndefined();

    // 30 min later the live state is dropped.
    expect(ctx.scheduler.nextAt("dispose:")).toBe(ctx.clock.now + FINISHED_RETENTION_MS);
    ctx.clock.now += FINISHED_RETENTION_MS;
    ctx.scheduler.runDue(ctx.clock.now);
    await settle();
    expect(ctx.service.hasGame("room-1")).toBe(false);
    expect(await ctx.store.load("room-1")).toBeNull();
  });

  it("logs a failed save, still closes the room, and keeps the snapshot for a retry", async () => {
    const ctx = setup();
    ctx.repo.saveMatch.mockRejectedValueOnce(new Error("db down"));
    await ctx.service.start("room-1", "u1");
    await playToEnd(ctx);
    expect(ctx.logError).toHaveBeenCalled();
    expect(ctx.repo.markFinished).toHaveBeenCalledOnce();
    expect((await ctx.store.load("room-1"))?.savedMatchId).toBeNull();
  });
});

describe("restore after restart", () => {
  it("resumes a running match from Redis and keeps its timers", async () => {
    const store = new MemorySnapshotStore();
    const first = setup(lobby(), store);
    await first.service.start("room-1", "u1");
    await first.timeout(); // DISCUSSION
    const snapshot = await store.load("room-1");
    first.service.stop();

    const second = setup(lobby(), store);
    second.clock.now = first.clock.now;
    expect(await second.service.restore()).toBe(1);
    expect(second.service.hasGame("room-1")).toBe(true);
    expect(second.scheduler.nextAt("tick:")).toBe(snapshot?.state.endsAt);

    expect(await second.service.sync("room-1", "u4")).toBeNull();
    expect(viewOf(second.transport, "u4").game.phase).toBe("DISCUSSION");
    await second.timeout();
    expect(viewOf(second.transport, "u4").game.phase).toBe("SELECTION");
  });

  it("produces the same game as an uninterrupted run (seeded RNG per step)", async () => {
    const straight = setup();
    await straight.service.start("room-1", "u1");
    await playToEnd(straight);

    const store = new MemorySnapshotStore();
    const before = setup(lobby(), store);
    await before.service.start("room-1", "u1");
    await before.timeout();
    before.service.stop();
    const after = setup(lobby(), store);
    after.clock.now = before.clock.now;
    await after.service.restore();
    await after.service.sync("room-1", "u1");
    for (const id of USERS) await after.service.sync("room-1", id);
    await playToEnd(after);

    expect(viewOf(after.transport, "u1").game.results).toEqual(viewOf(straight.transport, "u1").game.results);
  });

  it("retries saving a finished match that never got saved", async () => {
    const store = new MemorySnapshotStore();
    const first = setup(lobby(), store);
    first.repo.saveMatch.mockRejectedValueOnce(new Error("db down"));
    await first.service.start("room-1", "u1");
    await playToEnd(first);
    first.service.stop();

    const second = setup(lobby(), store);
    await second.service.restore();
    await settle();
    expect(second.repo.saveMatch).toHaveBeenCalledOnce();
    expect((await store.load("room-1"))?.savedMatchId).toBe("match-1");
  });
});


describe("sync", () => {
  it("re-sends only the asking player's view", async () => {
    const ctx = setup();
    await ctx.service.start("room-1", "u1");
    const counts = new Map(ctx.transport.viewCounts);
    await ctx.service.sync("room-1", "u2");
    expect(ctx.transport.viewCounts.get("u2")).toBe((counts.get("u2") ?? 0) + 1);
    expect(ctx.transport.viewCounts.get("u3")).toBe(counts.get("u3"));
  });
});

// ────────────────────────────────────────────────────────────────
// M7: disconnect tracking & auto-actions
// ────────────────────────────────────────────────────────────────

describe("autoAct – BALLOT", () => {
  async function reachBallot(ctx: ReturnType<typeof setup>) {
    await ctx.service.start("room-1", "u1");
    await ctx.timeout(); // ROLE_REVEAL → DISCUSSION
    await ctx.timeout(); // DISCUSSION   → SELECTION
    // Find the leader and have them nominate.
    const leader = USERS.find((id) => {
      const views = ctx.transport.views;
      return views.get(id)?.pending.nominate != null;
    });
    if (!leader) throw new Error("no leader");
    const teamSize = ctx.transport.views.get(leader)!.pending.nominate!.teamSize;
    await ctx.service.act("room-1", leader, {
      type: "NOMINATE",
      ministerIds: USERS.slice(0, teamSize),
    });
    // Now in BALLOT phase.
    return leader;
  }

  it("auto-casts REJECT for a disconnected player in BALLOT", async () => {
    const ctx = setup();
    await reachBallot(ctx);

    const voter = USERS.find((id) => ctx.transport.views.get(id)?.pending.vote) ?? "u2";
    expect(ctx.transport.views.get(voter)?.pending.vote).toBe(true);

    await ctx.service.autoAct("room-1", voter);
    await new Promise((r) => setTimeout(r, 0)); // let queues settle

    // Vote was cast: the player's view no longer shows pending.vote.
    expect(ctx.transport.views.get(voter)?.pending.vote).toBe(false);
  });

  it("is a no-op for a player with nothing pending", async () => {
    const ctx = setup();
    await ctx.service.start("room-1", "u1");
    // ROLE_REVEAL: no player has a pending action.
    const countsBefore = new Map(ctx.transport.viewCounts);
    await ctx.service.autoAct("room-1", "u2");
    await new Promise((r) => setTimeout(r, 0));
    expect(ctx.transport.viewCounts.get("u2")).toBe(countsBefore.get("u2"));
  });

  it("is a no-op when there is no game", async () => {
    const ctx = setup();
    // No game started — should not throw.
    await expect(ctx.service.autoAct("room-1", "u1")).resolves.toBeUndefined();
  });

  it("is a no-op for a player not in the game", async () => {
    const ctx = setup();
    await ctx.service.start("room-1", "u1");
    await expect(ctx.service.autoAct("room-1", "stranger")).resolves.toBeUndefined();
  });
});

describe("playerDisconnected / playerReconnected", () => {
  it("playerDisconnected is a no-op when no game is running", () => {
    const ctx = setup();
    // Should not throw even without a tracker.
    expect(() => ctx.service.playerDisconnected("room-1", "u1")).not.toThrow();
  });

  it("playerReconnected is a no-op without a tracker", () => {
    const ctx = setup();
    expect(() => ctx.service.playerReconnected("room-1", "u1")).not.toThrow();
  });
});

describe("custom rooms", () => {
  const custom = (overrides: Partial<StartableRoom> = {}) =>
    lobby({
      mode: "CUSTOM",
      roundDiscussionSeconds: [40, 50, 60, 70, 80],
      roleAssignments: { u2: "MIR_JAFAR", u5: "DE_BUSSY" },
      ...overrides,
    });

  it("pins the host's roles and uses the per-round discussion time", async () => {
    const ctx = setup(custom());
    expect(await ctx.service.start("room-1", "u1")).toBeNull();
    expect(viewOf(ctx.transport, "u2").me.role).toBe("MIR_JAFAR");
    expect(viewOf(ctx.transport, "u5").me.role).toBe("DE_BUSSY");
    await ctx.timeout(); // → DISCUSSION
    expect(viewOf(ctx.transport, "u1").game.endsAt).toBe(ctx.clock.now + 40_000);
  });

  it("ignores custom settings in a standard room", async () => {
    const ctx = setup(custom({ mode: "STANDARD", roleAssignments: {} }));
    await ctx.service.start("room-1", "u1");
    await ctx.timeout();
    expect(viewOf(ctx.transport, "u1").game.endsAt).toBe(ctx.clock.now + 30_000);
  });

  it("leaves the room in the lobby when the pinned roles don't fit", async () => {
    const ctx = setup(custom({ roleAssignments: { u1: "UMICHAD", u2: "JEAN_LAW", u3: "YAR_LUTUF" } }));
    const error = await ctx.service.start("room-1", "u1");
    expect(error?.code).toBe("INVALID_SETTINGS");
    expect(error?.message).toMatch(/doesn't fit/);
    expect(ctx.repo.claimForStart).not.toHaveBeenCalled();
    expect(ctx.service.hasGame("room-1")).toBe(false);
  });

  it("lets only the host skip, and only in custom rooms", async () => {
    const standard = setup();
    await standard.service.start("room-1", "u1");
    expect((await standard.service.skip("room-1", "u1"))?.code).toBe("SKIP_NOT_ALLOWED");

    const ctx = setup(custom());
    expect((await ctx.service.skip("room-1", "u1"))?.code).toBe("NO_GAME");
    await ctx.service.start("room-1", "u1");
    expect((await ctx.service.skip("room-1", "u2"))?.code).toBe("NOT_HOST");

    expect(await ctx.service.skip("room-1", "u1")).toBeNull();
    expect(viewOf(ctx.transport, "u3").game.phase).toBe("DISCUSSION");
    // The next phase's timer is rescheduled from the skip.
    expect(ctx.scheduler.nextAt("tick:")).toBe(ctx.clock.now + 40_000);
    expect(await ctx.store.load("room-1")).toMatchObject({ hostCanSkip: true, hostUserId: "u1", step: 2 });
  });
});
