import { describe, expect, it } from "vitest";
import { createGame } from "../src/createGame.js";
import { reduce } from "../src/reduce.js";
import { createRng } from "../src/rng.js";
import type { GameState } from "../src/types.js";
import { viewFor } from "../src/vision/viewFor.js";
import { T0, playerIds } from "./helpers.js";

/** A 6-player game in Discussion with its 120 s timer running from T0. */
function discussion(): GameState {
  const rng = createRng(1);
  const { state } = createGame({ playerIds: playerIds(6), now: T0, rng });
  return reduce(state, { type: "SKIP" }, T0, rng).state;
}

describe("custom room: PAUSE / RESUME", () => {
  it("freezes the timer and keeps the time that was left", () => {
    const rng = createRng(1);
    const { state, events } = reduce(discussion(), { type: "PAUSE" }, T0 + 20_000, rng);
    expect(state.endsAt).toBeNull();
    expect(state.pausedRemainingMs).toBe(100_000);
    expect(events).toEqual([{ type: "GAME_PAUSED", remainingMs: 100_000 }]);
    expect(viewFor(state, "p1").game.pausedRemainingMs).toBe(100_000);
  });

  it("never times out while paused", () => {
    const rng = createRng(1);
    const paused = reduce(discussion(), { type: "PAUSE" }, T0, rng).state;
    const later = reduce(paused, { type: "TICK" }, T0 + 10 * 60_000, rng);
    expect(later.events).toEqual([]);
    expect(later.state.phase).toBe("DISCUSSION");
  });

  it("resumes with the remaining time from the moment of resuming", () => {
    const rng = createRng(1);
    const paused = reduce(discussion(), { type: "PAUSE" }, T0 + 20_000, rng).state;
    const { state, events } = reduce(paused, { type: "RESUME" }, T0 + 500_000, rng);
    expect(state.endsAt).toBe(T0 + 500_000 + 100_000);
    expect(state.pausedRemainingMs).toBeNull();
    expect(events).toEqual([{ type: "GAME_RESUMED", endsAt: T0 + 600_000 }]);
  });

  it("does nothing when there is no timer to pause or nothing to resume", () => {
    const rng = createRng(1);
    const state = discussion();
    expect(reduce(state, { type: "RESUME" }, T0, rng).events).toEqual([]);
    const paused = reduce(state, { type: "PAUSE" }, T0, rng).state;
    expect(reduce(paused, { type: "PAUSE" }, T0, rng).events).toEqual([]);
  });

  it("rejects player actions and shows nothing pending while paused", () => {
    const rng = createRng(1);
    let state = discussion();
    state = reduce(state, { type: "SKIP" }, T0, rng).state; // → SELECTION
    const leader = state.players.find((p) => p.seat === state.leaderSeat)!;
    const paused = reduce(state, { type: "PAUSE" }, T0, rng).state;

    expect(viewFor(paused, leader.id).pending.nominate).toBeNull();
    const { state: after, events } = reduce(
      paused,
      { type: "NOMINATE", playerId: leader.id, ministerIds: ["p1", "p2"] },
      T0,
      rng
    );
    expect(events).toEqual([{ type: "ACTION_REJECTED", playerId: leader.id, code: "GAME_PAUSED" }]);
    expect(after).toBe(paused);
  });

  it("lets the host skip a paused phase, which also clears the pause", () => {
    const rng = createRng(1);
    const paused = reduce(discussion(), { type: "PAUSE" }, T0, rng).state;
    const { state } = reduce(paused, { type: "SKIP" }, T0 + 5_000, rng);
    expect(state.phase).toBe("SELECTION");
    expect(state.pausedRemainingMs).toBeNull();
    expect(state.endsAt).toBe(T0 + 5_000 + 60_000);
  });
});
