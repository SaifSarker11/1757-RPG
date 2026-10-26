import { describe, expect, it, vi } from "vitest";
import { createDisconnectTracker, DISCONNECT_GRACE_MS } from "./disconnectTracker.js";
import type { Scheduler } from "./scheduler.js";

class FakeScheduler implements Scheduler {
  readonly jobs = new Map<string, { at: number; run: () => void }>();
  now = 0;

  schedule(key: string, at: number, run: () => void) {
    this.jobs.set(key, { at, run });
  }
  cancel(key: string) {
    this.jobs.delete(key);
  }
  cancelAll() {
    this.jobs.clear();
  }
  /** Fire all timers whose deadline has been reached. */
  runDue() {
    for (const [k, job] of [...this.jobs.entries()]) {
      if (job.at <= this.now) {
        this.jobs.delete(k);
        job.run();
      }
    }
  }
}

function setup(graceMs = DISCONNECT_GRACE_MS) {
  const scheduler = new FakeScheduler();
  const onGraceExpired = vi.fn<[string, string], void>();
  const tracker = createDisconnectTracker({
    scheduler,
    onGraceExpired,
    now: () => scheduler.now,
    graceMs,
  });
  return { scheduler, tracker, onGraceExpired };
}

describe("playerLeft / isOffline", () => {
  it("marks a player offline immediately", () => {
    const { tracker } = setup();
    expect(tracker.isOffline("r1", "u1")).toBe(false);
    tracker.playerLeft("r1", "u1");
    expect(tracker.isOffline("r1", "u1")).toBe(true);
  });

  it("schedules a timer for the grace period", () => {
    const { scheduler, tracker } = setup(5_000);
    scheduler.now = 1_000;
    tracker.playerLeft("r1", "u1");
    const job = scheduler.jobs.get("disconnect:r1:u1");
    expect(job?.at).toBe(6_000);
  });
});

describe("playerReturned", () => {
  it("marks the player online and cancels the timer", () => {
    const { scheduler, tracker } = setup();
    tracker.playerLeft("r1", "u1");
    tracker.playerReturned("r1", "u1");
    expect(tracker.isOffline("r1", "u1")).toBe(false);
    expect(scheduler.jobs.has("disconnect:r1:u1")).toBe(false);
  });

  it("does not call onGraceExpired after the player reconnects", () => {
    const { scheduler, tracker, onGraceExpired } = setup(5_000);
    tracker.playerLeft("r1", "u1");
    tracker.playerReturned("r1", "u1");
    scheduler.now = 10_000;
    scheduler.runDue();
    expect(onGraceExpired).not.toHaveBeenCalled();
  });
});

describe("onGraceExpired", () => {
  it("fires after the grace period if the player has not returned", () => {
    const { scheduler, tracker, onGraceExpired } = setup(5_000);
    tracker.playerLeft("r1", "u1");
    scheduler.now = 5_001;
    scheduler.runDue();
    expect(onGraceExpired).toHaveBeenCalledWith("r1", "u1");
  });

  it("does not fire for a different player", () => {
    const { scheduler, tracker, onGraceExpired } = setup(5_000);
    tracker.playerLeft("r1", "u1");
    tracker.playerLeft("r1", "u2");
    tracker.playerReturned("r1", "u1");
    scheduler.now = 10_000;
    scheduler.runDue();
    expect(onGraceExpired).toHaveBeenCalledTimes(1);
    expect(onGraceExpired).toHaveBeenCalledWith("r1", "u2");
  });
});

describe("offlineUsers", () => {
  it("returns the current set of offline users for a room", () => {
    const { tracker } = setup();
    tracker.playerLeft("r1", "u1");
    tracker.playerLeft("r1", "u2");
    tracker.playerLeft("r2", "u3");
    expect([...tracker.offlineUsers("r1")].sort()).toEqual(["u1", "u2"]);
    expect([...tracker.offlineUsers("r2")]).toEqual(["u3"]);
  });
});

describe("clearRoom", () => {
  it("removes all offline state and cancels all timers for the room", () => {
    const { scheduler, tracker, onGraceExpired } = setup(5_000);
    tracker.playerLeft("r1", "u1");
    tracker.playerLeft("r1", "u2");
    tracker.clearRoom("r1");
    expect(tracker.isOffline("r1", "u1")).toBe(false);
    expect(tracker.isOffline("r1", "u2")).toBe(false);
    expect(scheduler.jobs.size).toBe(0);
    scheduler.now = 10_000;
    scheduler.runDue();
    expect(onGraceExpired).not.toHaveBeenCalled();
  });
});
