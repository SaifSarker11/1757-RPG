import { describe, expect, it } from "vitest";
import { ballotWeight } from "../src/config/gameConfig.js";
import { tallyBallot } from "../src/phases/ballot.js";
import type { RoleId, Vote } from "../src/types.js";
import { viewFor } from "../src/vision/viewFor.js";
import { Harness, eventsOfType } from "./helpers.js";

// p1 Saint Frais (Green, x2), p4 Yar Lutuf (Red, x2).
const CAST: RoleId[] = ["NAWAB_SIRAJ", "SAINT_FRASY", "LOYALIST", "LOYALIST", "YAR_LUTUF", "EIC_SPY"];

function ballot(votes: Record<string, Vote>, roles: RoleId[] = CAST) {
  const h = new Harness(roles.length, 1, 30, roles);
  h.nominate(["p0", "p2"]);
  for (const [id, vote] of Object.entries(votes)) {
    h.dispatch({ type: "CAST_VOTE", playerId: id, vote });
  }
  const resolved = eventsOfType(h.log, "BALLOT_RESOLVED")[0];
  if (!resolved) throw new Error("ballot did not resolve");
  return resolved;
}

describe("ballotWeight", () => {
  it("is 2 for Saint Frais and Yar Lutuf, 1 for everyone else", () => {
    expect(ballotWeight("SAINT_FRASY")).toBe(2);
    expect(ballotWeight("YAR_LUTUF")).toBe(2);
    for (const role of ["NAWAB_SIRAJ", "MIR_JAFAR", "JAGAT_SETH", "LOYALIST", "EIC_SPY"] as const) {
      expect(ballotWeight(role)).toBe(1);
    }
  });
});

describe("tallyBallot with weights", () => {
  it("adds each voter's weight but counts heads once", () => {
    const weights: Record<string, number> = { a: 2, b: 1, c: 1 };
    const tally = tallyBallot({ a: "APPROVE", b: "REJECT", c: "REJECT" }, (id) => weights[id] ?? 1);
    expect(tally).toEqual({
      approve: 2,
      reject: 2,
      headcount: { approve: 1, reject: 2 },
      approved: false,
    });
  });
});

describe("weighted ballot in a game", () => {
  it("one double voter per side on a 3-3 headcount is a weighted tie, so rejected", () => {
    const resolved = ballot({ p1: "APPROVE", p0: "APPROVE", p2: "APPROVE", p3: "REJECT", p5: "REJECT", p4: "REJECT" });
    // Weighted: approve 2+1+1 = 4, reject 1+1+2 = 4 → tie → rejected.
    expect(resolved.headcount).toEqual({ approve: 3, reject: 3 });
    expect(resolved.approved).toBe(false);
  });

  it("both double voters approving win a 3-3 headcount", () => {
    const resolved = ballot({ p1: "APPROVE", p4: "APPROVE", p0: "APPROVE", p2: "REJECT", p3: "REJECT", p5: "REJECT" });
    // Weighted: approve 2+2+1 = 5 vs reject 3.
    expect(resolved.headcount).toEqual({ approve: 3, reject: 3 });
    expect(resolved.approved).toBe(true);
  });

  it("Yar Lutuf can sink a 4-2 headcount with Saint Frais", () => {
    const resolved = ballot({ p1: "REJECT", p4: "REJECT", p0: "APPROVE", p2: "APPROVE", p3: "APPROVE", p5: "APPROVE" });
    // Weighted: approve 4 vs reject 4 → tie → rejected.
    expect(resolved.headcount).toEqual({ approve: 4, reject: 2 });
    expect(resolved.approved).toBe(false);
  });

  it("a weighted tie is rejected", () => {
    const resolved = ballot({ p4: "REJECT", p0: "REJECT", p5: "REJECT", p1: "APPROVE", p2: "APPROVE", p3: "REJECT" });
    // approve 2+1 = 3, reject 2+1+1+1 = 5
    expect(resolved.approved).toBe(false);
  });

  it("without double voters, weighted and raw counts agree", () => {
    const plain: RoleId[] = ["NAWAB_SIRAJ", "LUTFUNNESA", "LOYALIST", "LOYALIST", "EIC_SPY", "EIC_SPY"];
    const resolved = ballot(
      { p0: "APPROVE", p1: "APPROVE", p2: "APPROVE", p3: "APPROVE", p4: "REJECT", p5: "REJECT" },
      plain
    );
    expect(resolved).toMatchObject({ approved: true, headcount: { approve: 4, reject: 2 } });
  });

  it("a timed-out double voter counts as a weighted Approve", () => {
    const h = new Harness(6, 1, 30, CAST);
    h.nominate(["p0", "p2"]);
    for (const id of ["p0", "p2", "p3", "p5"]) {
      h.dispatch({ type: "CAST_VOTE", playerId: id, vote: "REJECT" });
    }
    h.dispatch({ type: "CAST_VOTE", playerId: "p4", vote: "APPROVE" });
    h.timeout(); // Saint Frais (p1) never voted → Approve x2
    const resolved = eventsOfType(h.log, "BALLOT_RESOLVED")[0];
    // approve 2+2 = 4 vs reject 4 → tie → rejected
    expect(resolved?.headcount).toEqual({ approve: 2, reject: 4 });
    expect(resolved?.approved).toBe(false);
  });

  it("the event never contains weighted totals", () => {
    const resolved = ballot({ p1: "APPROVE", p4: "APPROVE", p0: "APPROVE", p2: "REJECT", p3: "REJECT", p5: "REJECT" });
    expect(Object.keys(resolved).sort()).toEqual(["approved", "failTrack", "headcount", "type", "votes"]);
  });
});

describe("viewFor and weights", () => {
  it("each player sees only their own weight", () => {
    const h = new Harness(6, 1, 30, CAST);
    expect(viewFor(h.state, "p1").myVoteWeight).toBe(2);
    expect(viewFor(h.state, "p4").myVoteWeight).toBe(2);
    expect(viewFor(h.state, "p0").myVoteWeight).toBe(1);
    expect(JSON.stringify(viewFor(h.state, "p0"))).not.toContain("SAINT_FRASY");
  });

  it("offers Greens only Success and Reds both cards", () => {
    const h = new Harness(6, 1, 30, CAST);
    h.nominate(["p1", "p4"]);
    h.voteAll("APPROVE");
    expect(viewFor(h.state, "p1").pending.allowedCards).toEqual(["SUCCESS"]);
    expect(viewFor(h.state, "p4").pending.allowedCards).toEqual(["SUCCESS", "SABOTAGE"]);
    expect(viewFor(h.state, "p0").pending.allowedCards).toEqual([]);
  });

  it("shows the latest results card to everyone", () => {
    const h = new Harness(6, 1, 30, CAST);
    h.nominate(["p0", "p2"]);
    h.voteAll("REJECT");
    for (const id of ["p0", "p3", "p5"]) {
      expect(viewFor(h.state, id).game.lastBallot).toMatchObject({
        approved: false,
        headcount: { approve: 0, reject: 6 },
      });
    }
  });
});
