import { describe, expect, it } from "vitest";
import { Harness, eventsOfType } from "./helpers.js";

function rejectionCode(h: Harness, playerId: string, ministerIds: string[]) {
  const events = h.dispatch({ type: "NOMINATE", playerId, ministerIds });
  return eventsOfType(events, "ACTION_REJECTED")[0]?.code;
}

describe("NOMINATE", () => {
  it("moves the Leader's valid nomination to BALLOT", () => {
    const h = new Harness();
    h.advanceTo("SELECTION");
    const ministers = ["p0", "p1"];
    const events = h.dispatch({ type: "NOMINATE", playerId: h.leaderId, ministerIds: ministers });
    expect(eventsOfType(events, "NOMINATION_MADE")[0]).toMatchObject({ ministerIds: ministers });
    expect(h.state.phase).toBe("BALLOT");
    expect(h.state.endsAt).toBe(h.now + 30_000);
    expect(h.state.ministerIds).toEqual(ministers);
  });

  it("is rejected outside SELECTION", () => {
    const h = new Harness();
    h.advanceTo("DISCUSSION");
    expect(rejectionCode(h, h.leaderId, ["p0", "p1"])).toBe("WRONG_PHASE");
  });

  it("is rejected from anyone but the Leader", () => {
    const h = new Harness();
    h.advanceTo("SELECTION");
    const other = h.state.players.find((p) => p.id !== h.leaderId)?.id ?? "";
    expect(rejectionCode(h, other, ["p0", "p1"])).toBe("NOT_LEADER");
  });

  it("is rejected from a non-player", () => {
    const h = new Harness();
    h.advanceTo("SELECTION");
    expect(rejectionCode(h, "stranger", ["p0", "p1"])).toBe("NOT_IN_GAME");
  });

  it("needs exactly the round's team size", () => {
    const h = new Harness(); // 6 players: R1 needs 2
    h.advanceTo("SELECTION");
    expect(rejectionCode(h, h.leaderId, ["p0"])).toBe("INVALID_TEAM_SIZE");
    expect(rejectionCode(h, h.leaderId, ["p0", "p1", "p2"])).toBe("INVALID_TEAM_SIZE");
  });

  it("rejects duplicate and unknown ministers", () => {
    const h = new Harness();
    h.advanceTo("SELECTION");
    expect(rejectionCode(h, h.leaderId, ["p0", "p0"])).toBe("DUPLICATE_PLAYER");
    expect(rejectionCode(h, h.leaderId, ["p0", "ghost"])).toBe("UNKNOWN_PLAYER");
  });

  it("lets the Leader nominate themself", () => {
    const h = new Harness();
    h.advanceTo("SELECTION");
    const other = h.state.players.find((p) => p.id !== h.leaderId)?.id ?? "";
    expect(rejectionCode(h, h.leaderId, [h.leaderId, other])).toBeUndefined();
  });
});

describe("SELECTION timeout", () => {
  it("counts as a rejected nomination: fail track +1, next Leader, new Discussion", () => {
    const h = new Harness();
    h.advanceTo("SELECTION");
    const leaderSeat = h.state.leaderSeat;
    const events = h.timeout();

    expect(eventsOfType(events, "NOMINATION_TIMED_OUT")).toHaveLength(1);
    expect(h.state.failTrack).toBe(1);
    expect(h.state.leaderSeat).toBe((leaderSeat + 1) % 6);
    expect(h.state.phase).toBe("DISCUSSION");
    expect(h.state.attempt).toBe(2);
    expect(h.state.nominations.at(-1)).toMatchObject({ ministerIds: null, approved: false });
  });

  it("five timeouts in a row deadlock the round for Red", () => {
    const h = new Harness();
    for (let i = 0; i < 5; i++) {
      h.advanceTo("SELECTION");
      h.timeout();
    }
    expect(eventsOfType(h.log, "ROUND_DEADLOCKED")).toEqual([{ type: "ROUND_DEADLOCKED", round: 1 }]);
    expect(h.state.phase).toBe("ROUND_RESULT");
    expect(h.state.roundResults).toEqual([
      { round: 1, winner: "RED", reason: "DEADLOCK", successCount: 0, sabotageCount: 0 },
    ]);
    expect(h.state.failTrack).toBe(0);
  });
});

describe("Leader rotation", () => {
  it("rotates in seat order on every nomination, wrapping around", () => {
    const h = new Harness();
    const seats: number[] = [h.state.leaderSeat];
    for (let i = 0; i < 4; i++) {
      h.advanceTo("SELECTION");
      h.timeout();
      seats.push(h.state.leaderSeat);
    }
    for (let i = 1; i < seats.length; i++) {
      expect(seats[i]).toBe(((seats[i - 1] ?? 0) + 1) % 6);
    }
  });

  it("also rotates after an approved nomination", () => {
    const h = new Harness();
    const first = h.state.leaderSeat;
    h.playRound("SUCCESS");
    expect(h.state.round).toBe(2);
    expect(h.state.leaderSeat).toBe((first + 1) % 6);
  });
});
