import { describe, expect, it } from "vitest";
import type { RoleId } from "../src/types.js";
import { Harness, eventsOfType } from "./helpers.js";

// Seats 0-3 Green, 4-5 Red: Saint Frais and Yar Lutuf double vote, but cards stay 1 each.
const CAST: RoleId[] = ["NAWAB_SIRAJ", "SAINT_FRASY", "LOYALIST", "LOYALIST", "YAR_LUTUF", "EIC_SPY"];

function toResolution(ministers: string[], roles: RoleId[] = CAST): Harness {
  const h = new Harness(roles.length, 1, 30, roles);
  // Round 1 at 6 players needs 2 ministers.
  h.nominate(ministers);
  h.voteAll("APPROVE");
  expect(h.state.phase).toBe("RESOLUTION");
  return h;
}

function codeOf(h: Harness, playerId: string, card: "SUCCESS" | "SABOTAGE") {
  const events = h.dispatch({ type: "PLAY_CARD", playerId, card });
  return eventsOfType(events, "ACTION_REJECTED")[0]?.code;
}

describe("card rules", () => {
  it("a Green minister can't play Sabotage", () => {
    const h = toResolution(["p0", "p1"]);
    expect(codeOf(h, "p0", "SABOTAGE")).toBe("CARD_NOT_ALLOWED");
    expect(h.state.cards.p0).toBeUndefined();
  });

  it("the rejected Green can still play Success afterwards", () => {
    const h = toResolution(["p0", "p1"]);
    codeOf(h, "p0", "SABOTAGE");
    expect(codeOf(h, "p0", "SUCCESS")).toBeUndefined();
  });

  it("a Loyalist filler can't sabotage either", () => {
    const h = toResolution(["p2", "p3"]);
    expect(codeOf(h, "p2", "SABOTAGE")).toBe("CARD_NOT_ALLOWED");
  });

  it("Reds, including the EIC Spy filler, may play either card", () => {
    const h = toResolution(["p4", "p5"]);
    expect(codeOf(h, "p4", "SUCCESS")).toBeUndefined();
    expect(codeOf(h, "p5", "SABOTAGE")).toBeUndefined();
  });

  it("Jagat Seth (Gold) may sabotage [DEFAULT]", () => {
    const roles: RoleId[] = [
      "NAWAB_SIRAJ", "LUTFUNNESA", "MIR_MADAN", "LOYALIST", "LOYALIST",
      "MIR_JAFAR", "RAI_DURLABH", "EIC_SPY", "JAGAT_SETH",
    ];
    const h = new Harness(9, 1, 30, roles); // R1 at 9 players needs 3
    h.nominate(["p8", "p0", "p1"]);
    h.voteAll("APPROVE");
    expect(codeOf(h, "p8", "SABOTAGE")).toBeUndefined();
  });

  it("ALREADY_PLAYED wins over CARD_NOT_ALLOWED for a second card", () => {
    const h = toResolution(["p0", "p1"]);
    codeOf(h, "p0", "SUCCESS");
    expect(codeOf(h, "p0", "SABOTAGE")).toBe("ALREADY_PLAYED");
  });
});

describe("mission cards are not weighted", () => {
  it("Yar Lutuf's Sabotage counts once", () => {
    const h = toResolution(["p4", "p0"]);
    codeOf(h, "p4", "SABOTAGE");
    codeOf(h, "p0", "SUCCESS");
    expect(eventsOfType(h.log, "MISSION_RESOLVED")[0]).toMatchObject({
      successCount: 1,
      sabotageCount: 1,
    });
  });

  it("Saint Frais' Success counts once", () => {
    const h = toResolution(["p1", "p5"]);
    codeOf(h, "p1", "SUCCESS");
    codeOf(h, "p5", "SABOTAGE");
    expect(eventsOfType(h.log, "MISSION_RESOLVED")[0]).toMatchObject({
      successCount: 1,
      sabotageCount: 1,
      winner: "RED",
    });
  });

  it("one Yar Lutuf Sabotage is not enough in Round 4 at 7 players", () => {
    const roles: RoleId[] = [
      "NAWAB_SIRAJ", "LUTFUNNESA", "LOYALIST", "LOYALIST", "YAR_LUTUF", "EIC_SPY", "EIC_SPY",
    ];
    const h = new Harness(7, 1, 30, roles);
    // Green, Red, Green so the match is open at Round 4.
    for (const card of ["SUCCESS", "SABOTAGE", "SUCCESS"] as const) h.playRound(card);
    expect(h.state.round).toBe(4);
    h.nominate(["p4", "p0", "p1", "p2"]); // R4 at 7 players needs 4
    h.voteAll("APPROVE");
    codeOf(h, "p4", "SABOTAGE");
    for (const id of ["p0", "p1", "p2"]) codeOf(h, id, "SUCCESS");
    expect(eventsOfType(h.log, "MISSION_RESOLVED").at(-1)).toMatchObject({
      round: 4,
      sabotageCount: 1,
      winner: "GREEN",
    });
  });
});
