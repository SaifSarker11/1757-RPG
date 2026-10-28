import { describe, expect, it } from "vitest";
import { createGame } from "../src/createGame.js";
import { createRng } from "../src/rng.js";
import { T0, playerIds } from "./helpers.js";

describe("createGame", () => {
  it("opens ROLE_REVEAL for 15 s in round 1", () => {
    const { state, events } = createGame({ playerIds: playerIds(6), now: T0, rng: createRng(1) });
    expect(state.phase).toBe("ROLE_REVEAL");
    expect(state.endsAt).toBe(T0 + 15_000);
    expect(state.round).toBe(1);
    expect(state.attempt).toBe(1);
    expect(state.failTrack).toBe(0);
    expect(events).toEqual([
      { type: "PHASE_CHANGED", phase: "ROLE_REVEAL", round: 1, leaderSeat: state.leaderSeat, endsAt: T0 + 15_000 },
    ]);
  });

  it("seats players in the given order with one role each", () => {
    const { state } = createGame({ playerIds: playerIds(9), now: T0, rng: createRng(2) });
    expect(state.players.map((p) => p.id)).toEqual(playerIds(9));
    expect(state.players.map((p) => p.seat)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("picks a random first Leader within the seats", () => {
    const leaders = new Set<number>();
    for (let seed = 0; seed < 60; seed++) {
      const { state } = createGame({ playerIds: playerIds(6), now: T0, rng: createRng(seed) });
      expect(state.leaderSeat).toBeGreaterThanOrEqual(0);
      expect(state.leaderSeat).toBeLessThan(6);
      leaders.add(state.leaderSeat);
    }
    expect(leaders.size).toBeGreaterThan(1);
  });

  it("applies host settings", () => {
    const { state } = createGame({
      playerIds: playerIds(6),
      settings: { discussionSeconds: 45, enabledRoles: [] },
      now: T0,
      rng: createRng(3),
    });
    expect(state.settings.discussionSeconds).toBe(45);
    expect(state.settings.enabledRoles).toEqual(["NAWAB_SIRAJ"]);
  });

  it("rejects too few players", () => {
    expect(() => createGame({ playerIds: playerIds(5), now: T0, rng: createRng(1) })).toThrow(
      RangeError
    );
  });
});
