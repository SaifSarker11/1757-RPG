import { describe, expect, it } from "vitest";
import { MAX_PLAYERS, MIN_PLAYERS } from "../src/config/gameConfig.js";
import { roundWins } from "../src/phases/round.js";
import { Harness, eventsOfType } from "./helpers.js";

describe("round flow", () => {
  it("ROUND_RESULT → next round's Discussion with a fresh attempt", () => {
    const h = new Harness();
    h.nominateFirst();
    h.voteAll("APPROVE");
    h.playAll("SUCCESS");
    expect(h.state.phase).toBe("ROUND_RESULT");
    expect(h.state.endsAt).toBe(h.now + 8_000);
    h.timeout();
    expect(h.state.phase).toBe("DISCUSSION");
    expect(h.state.round).toBe(2);
    expect(h.state.attempt).toBe(1);
  });

  it("uses the round's team size", () => {
    const h = new Harness(); // 6 players: 2-3-4-3-4
    h.playRound("SABOTAGE");
    h.nominateFirst();
    expect(h.state.ministerIds).toHaveLength(3);
  });
});

describe("match end", () => {
  it("Green wins 3-0 on rounds and the match goes to POST_GAME", () => {
    const h = new Harness();
    for (let i = 0; i < 3; i++) h.playRound("SUCCESS");
    expect(h.state.phase).toBe("POST_GAME");
    expect(h.state.endsAt).toBeNull();
    expect(h.state.outcome).toEqual({ winner: "GREEN", reason: "ROUNDS" });
    expect(eventsOfType(h.log, "GAME_ENDED")).toHaveLength(1);
  });

  it("Red wins 3-2 after five rounds", () => {
    const h = new Harness();
    for (const card of ["SUCCESS", "SABOTAGE", "SUCCESS", "SABOTAGE", "SABOTAGE"] as const) {
      h.playRound(card);
    }
    expect(roundWins(h.state.roundResults, "GREEN")).toBe(2);
    expect(roundWins(h.state.roundResults, "RED")).toBe(3);
    expect(h.state.outcome?.winner).toBe("RED");
  });

  it("deadlocked rounds count towards Red's 3", () => {
    const h = new Harness();
    for (let round = 0; round < 3; round++) {
      for (let i = 0; i < 5; i++) {
        h.advanceTo("SELECTION");
        h.timeout();
      }
      h.timeout(); // leave ROUND_RESULT
    }
    expect(h.state.outcome?.winner).toBe("RED");
    expect(h.state.roundResults.every((r) => r.reason === "DEADLOCK")).toBe(true);
  });

  it("rejects every action after the match ends", () => {
    const h = new Harness();
    for (let i = 0; i < 3; i++) h.playRound("SUCCESS");
    const events = h.dispatch({ type: "CAST_VOTE", playerId: "p0", vote: "APPROVE" });
    expect(eventsOfType(events, "ACTION_REJECTED")[0]?.code).toBe("WRONG_PHASE");
    expect(h.dispatch({ type: "TICK" })).toEqual([]);
  });
});

describe("full matches at every player count", () => {
  for (let n = MIN_PLAYERS; n <= MAX_PLAYERS; n++) {
    it(`a ${n}-player match driven only by timeouts ends on rounds`, () => {
      const h = new Harness(n, n);
      for (let guard = 0; h.state.phase !== "POST_GAME"; guard++) {
        if (guard > 500) throw new Error("match never ended");
        if (h.state.phase === "SELECTION") {
          h.nominateFirst();
        } else {
          h.timeout();
        }
      }
      // Timeouts approve every ballot and play Success, so Green sweeps.
      expect(h.state.outcome?.winner).toBe("GREEN");
      expect(h.state.roundResults).toHaveLength(3);
    });
  }
});
