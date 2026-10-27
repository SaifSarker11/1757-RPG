import { describe, expect, it } from "vitest";
import { tallyBallot } from "../src/phases/ballot.js";
import type { RoleId } from "../src/types.js";
import { Harness, eventsOfType } from "./helpers.js";

/** Six players with no double voters, so raw and weighted counts match. */
const PLAIN_SIX: RoleId[] = ["NAWAB_SIRAJ", "LUTFUNNESA", "LOYALIST", "LOYALIST", "EIC_SPY", "EIC_SPY"];

describe("tallyBallot", () => {
  it("approves on a majority", () => {
    expect(tallyBallot({ a: "APPROVE", b: "APPROVE", c: "REJECT" })).toEqual({
      approve: 2,
      reject: 1,
      headcount: { approve: 2, reject: 1 },
      approved: true,
    });
  });

  it("rejects ties", () => {
    expect(tallyBallot({ a: "APPROVE", b: "REJECT" }).approved).toBe(false);
  });
});

describe("CAST_VOTE", () => {
  it("hides the vote until everyone has voted", () => {
    const h = new Harness();
    h.nominateFirst();
    const events = h.dispatch({ type: "CAST_VOTE", playerId: "p0", vote: "REJECT" });
    expect(events).toEqual([{ type: "VOTE_CAST", playerId: "p0" }]);
    expect(h.state.phase).toBe("BALLOT");
  });

  it("allows one vote per player", () => {
    const h = new Harness();
    h.nominateFirst();
    h.dispatch({ type: "CAST_VOTE", playerId: "p0", vote: "APPROVE" });
    const events = h.dispatch({ type: "CAST_VOTE", playerId: "p0", vote: "REJECT" });
    expect(eventsOfType(events, "ACTION_REJECTED")[0]?.code).toBe("ALREADY_VOTED");
    expect(h.state.votes.p0).toBe("APPROVE");
  });

  it("is rejected outside BALLOT and from non-players", () => {
    const h = new Harness();
    h.advanceTo("SELECTION");
    let events = h.dispatch({ type: "CAST_VOTE", playerId: "p0", vote: "APPROVE" });
    expect(eventsOfType(events, "ACTION_REJECTED")[0]?.code).toBe("WRONG_PHASE");
    events = h.dispatch({ type: "CAST_VOTE", playerId: "ghost", vote: "APPROVE" });
    expect(eventsOfType(events, "ACTION_REJECTED")[0]?.code).toBe("NOT_IN_GAME");
  });

  it("resolves as soon as the last vote arrives and reveals every vote", () => {
    const h = new Harness();
    h.nominateFirst();
    h.voteAll("APPROVE");
    const resolved = eventsOfType(h.log, "BALLOT_RESOLVED");
    expect(resolved).toHaveLength(1);
    expect(resolved[0]).toMatchObject({ approved: true, failTrack: 0 });
    expect(Object.keys(resolved[0]?.votes ?? {})).toHaveLength(6);
    expect(h.state.phase).toBe("RESOLUTION");
  });
});

describe("ballot outcomes", () => {
  it("an approval resets the fail track", () => {
    const h = new Harness();
    h.advanceTo("SELECTION");
    h.timeout(); // fail track 1
    h.nominateFirst();
    h.voteAll("APPROVE");
    expect(h.state.failTrack).toBe(0);
  });

  it("a rejection adds to the fail track and starts a new Discussion", () => {
    const h = new Harness();
    h.nominateFirst();
    h.voteAll("REJECT");
    expect(eventsOfType(h.log, "BALLOT_RESOLVED")[0]).toMatchObject({ approved: false, failTrack: 1 });
    expect(h.state.phase).toBe("DISCUSSION");
    expect(h.state.round).toBe(1);
    expect(h.state.attempt).toBe(2);
    expect(h.state.ministerIds).toEqual([]);
    expect(h.state.votes).toEqual({});
  });

  it("a 3-3 tie is rejected", () => {
    const h = new Harness(6, 1, 30, PLAIN_SIX);
    h.nominateFirst();
    h.state.players.forEach((p, i) => {
      h.dispatch({ type: "CAST_VOTE", playerId: p.id, vote: i < 3 ? "APPROVE" : "REJECT" });
    });
    expect(eventsOfType(h.log, "BALLOT_RESOLVED")[0]?.approved).toBe(false);
  });

  it("five rejected ballots deadlock the round for Red", () => {
    const h = new Harness();
    for (let i = 0; i < 5; i++) {
      h.nominateFirst();
      h.voteAll("REJECT");
    }
    expect(h.state.phase).toBe("ROUND_RESULT");
    expect(h.state.roundResults[0]).toMatchObject({ winner: "RED", reason: "DEADLOCK" });
  });

  it("logs every nomination attempt with its votes", () => {
    const h = new Harness();
    h.nominateFirst();
    h.voteAll("REJECT");
    h.nominateFirst();
    h.voteAll("APPROVE");
    expect(h.state.nominations.map((n) => [n.attempt, n.approved])).toEqual([
      [1, false],
      [2, true],
    ]);
    expect(Object.keys(h.state.nominations[0]?.votes ?? {})).toHaveLength(6);
  });
});

describe("BALLOT timeout", () => {
  it("counts missing votes as Approve", () => {
    const h = new Harness(6, 1, 30, PLAIN_SIX);
    h.nominateFirst();
    h.dispatch({ type: "CAST_VOTE", playerId: "p0", vote: "REJECT" });
    h.dispatch({ type: "CAST_VOTE", playerId: "p1", vote: "REJECT" });
    h.timeout();
    const resolved = eventsOfType(h.log, "BALLOT_RESOLVED")[0];
    expect(resolved?.approved).toBe(true);
    expect(resolved?.votes).toMatchObject({ p0: "REJECT", p1: "REJECT", p2: "APPROVE" });
  });
});
