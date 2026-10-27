import { describe, expect, it } from "vitest";
import { ballotResultsCard, lastBallotResultsCard } from "../src/phases/resultsCard.js";
import type { RoleId } from "../src/types.js";
import { Harness } from "./helpers.js";

const CAST: RoleId[] = ["NAWAB_SIRAJ", "SAINT_FRASY", "LOYALIST", "LOYALIST", "YAR_LUTUF", "EIC_SPY"];

describe("ballotResultsCard", () => {
  it("is null before any nomination", () => {
    expect(lastBallotResultsCard(new Harness().state)).toBeNull();
  });

  it("lists every vote in seat order with the raw headcount", () => {
    const h = new Harness(6, 1, 30, CAST);
    h.nominate(["p0", "p2"]);
    for (const [id, vote] of [
      ["p5", "REJECT"],
      ["p1", "APPROVE"],
      ["p3", "REJECT"],
      ["p0", "APPROVE"],
      ["p4", "REJECT"],
      ["p2", "APPROVE"],
    ] as const) {
      h.dispatch({ type: "CAST_VOTE", playerId: id, vote });
    }
    const card = lastBallotResultsCard(h.state);
    expect(card?.votes.map((v) => v.seat)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(card?.headcount).toEqual({ approve: 3, reject: 3 });
    expect(card).toMatchObject({ round: 1, attempt: 1, ministerIds: ["p0", "p2"] });
  });

  it("never exposes weights", () => {
    const h = new Harness(6, 1, 30, CAST);
    h.nominate(["p0", "p2"]);
    h.voteAll("APPROVE");
    const card = lastBallotResultsCard(h.state);
    // 6 voters but a weighted total would be 8.
    expect(card?.headcount).toEqual({ approve: 6, reject: 0 });
    expect(JSON.stringify(card)).not.toMatch(/weight|8/i);
  });

  it("covers a timed-out nomination with no ministers and no votes", () => {
    const h = new Harness();
    h.advanceTo("SELECTION");
    h.timeout();
    expect(lastBallotResultsCard(h.state)).toMatchObject({
      ministerIds: null,
      approved: false,
      votes: [],
      headcount: { approve: 0, reject: 0 },
    });
  });

  it("builds a card for every attempt in the timeline", () => {
    const h = new Harness();
    h.nominateFirst();
    h.voteAll("REJECT");
    h.nominateFirst();
    h.voteAll("APPROVE");
    const cards = h.state.nominations.map((n) => ballotResultsCard(h.state, n));
    expect(cards.map((c) => [c.attempt, c.approved, c.headcount.approve])).toEqual([
      [1, false, 0],
      [2, true, 6],
    ]);
  });
});
