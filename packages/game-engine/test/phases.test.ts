import { describe, expect, it } from "vitest";
import { Harness, T0, eventsOfType } from "./helpers.js";

describe("phase timers", () => {
  it("ROLE_REVEAL → DISCUSSION after 15 s, using the host's discussion length", () => {
    const h = new Harness(6, 1, 45);
    h.timeout();
    expect(h.state.phase).toBe("DISCUSSION");
    expect(h.state.endsAt).toBe(T0 + 15_000 + 45_000);
  });

  it("DISCUSSION → SELECTION with a 60 s timer", () => {
    const h = new Harness();
    h.advanceTo("SELECTION");
    expect(h.state.endsAt).toBe(h.now + 60_000);
  });

  it("ignores a TICK before the deadline", () => {
    const h = new Harness();
    const before = h.state;
    h.now = (h.state.endsAt ?? 0) - 1;
    const events = h.dispatch({ type: "TICK" });
    expect(events).toEqual([]);
    expect(h.state).toEqual(before);
  });

  it("emits PHASE_CHANGED with the phase, round, Leader and deadline", () => {
    const h = new Harness();
    const events = h.timeout();
    expect(events).toEqual([
      {
        type: "PHASE_CHANGED",
        phase: "DISCUSSION",
        round: 1,
        leaderSeat: h.state.leaderSeat,
        endsAt: h.state.endsAt,
      },
    ]);
  });
});

describe("reduce purity", () => {
  it("never mutates the input state", () => {
    const h = new Harness();
    const snapshot = structuredClone(h.state);
    const frozen = h.state;
    h.timeout();
    expect(frozen).toEqual(snapshot);
  });

  it("returns the same state object for a rejected action", () => {
    const h = new Harness();
    const before = h.state;
    const events = h.dispatch({ type: "CAST_VOTE", playerId: "p0", vote: "APPROVE" });
    expect(h.state).toBe(before);
    expect(eventsOfType(events, "ACTION_REJECTED")).toHaveLength(1);
  });
});
