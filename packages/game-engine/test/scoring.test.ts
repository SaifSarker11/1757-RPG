import { describe, expect, it } from "vitest";
import { matchSummary, playerResults } from "../src/scoring.js";
import { NO_SETH, WITH_SETH, toEndgame } from "./fixtures.js";
import { Harness } from "./helpers.js";

// WITH_SETH: p0-p4 Green (p4 Saint Frais), p5 Mir Jafar, p6 Rai Durlabh, p7 Jean Law, p8 Jagat Seth.

function wonBy(h: Harness): string[] {
  return playerResults(h.state).filter((r) => r.won).map((r) => r.playerId);
}

/** Jean Law (p7) locks `targetId` in the first Discussion, then the match plays out. */
function withJeanLawLock(targetId: string, roundWinner: "GREEN" | "RED"): Harness {
  const h = new Harness(9, 1, 30, WITH_SETH);
  h.advanceTo("DISCUSSION");
  h.dispatch({ type: "JEANLAW_LOCK", playerId: "p7", targetId });
  const card = roundWinner === "GREEN" ? "SUCCESS" : "SABOTAGE";
  for (let i = 0; i < 3; i++) h.playRound(card);
  return h;
}

describe("playerResults", () => {
  it("Green win: every Green wins, Reds and Jagat Seth lose", () => {
    const h = toEndgame(WITH_SETH, "GREEN");
    h.dispatch({ type: "GUESS", playerId: "p5", targetId: "p3" });
    h.dispatch({ type: "GUESS", playerId: "p8", targetId: "p0" });
    expect(h.state.outcome?.winner).toBe("GREEN");
    expect(wonBy(h)).toEqual(["p0", "p1", "p2", "p3", "p4"]);
  });

  it("Red win: every Red wins, Greens and Jagat Seth lose", () => {
    const h = toEndgame(WITH_SETH, "RED");
    h.dispatch({ type: "GUESS", playerId: "p8", targetId: "p0" });
    expect(wonBy(h)).toEqual(["p5", "p6", "p7"]);
  });

  it("Gold win: Jagat Seth is the sole winner", () => {
    const h = toEndgame(WITH_SETH, "RED");
    h.dispatch({ type: "GUESS", playerId: "p8", targetId: "p6" });
    expect(wonBy(h)).toEqual(["p8"]);
  });

  it("throws before the match ends", () => {
    expect(() => playerResults(new Harness().state)).toThrow();
  });
});

describe("Jean Law win credit", () => {
  it("a locked Green loses when Green wins, and carries the humiliation flag", () => {
    const h = withJeanLawLock("p4", "GREEN");
    h.advanceTo("POST_GAME"); // guesses time out
    const target = playerResults(h.state).find((r) => r.playerId === "p4");
    expect(h.state.outcome?.winner).toBe("GREEN");
    expect(target).toMatchObject({ won: false, jeanLawLocked: true });
    expect(wonBy(h)).toEqual(["p0", "p1", "p2", "p3"]);
  });

  it("a locked Green wins with Red", () => {
    const h = withJeanLawLock("p4", "RED");
    h.advanceTo("POST_GAME");
    expect(h.state.outcome?.winner).toBe("RED");
    expect(wonBy(h)).toEqual(["p4", "p5", "p6", "p7"]);
  });

  it("a locked Green still loses a Gold win", () => {
    const h = withJeanLawLock("p4", "RED");
    h.dispatch({ type: "GUESS", playerId: "p8", targetId: "p6" });
    expect(wonBy(h)).toEqual(["p8"]);
    expect(playerResults(h.state).find((r) => r.playerId === "p4")?.jeanLawLocked).toBe(true);
  });

  it("locking a Red or Gold player changes nothing and sets no flag", () => {
    for (const target of ["p5", "p8"]) {
      const h = withJeanLawLock(target, "RED");
      h.advanceTo("POST_GAME");
      expect(wonBy(h)).toEqual(["p5", "p6", "p7"]);
      expect(playerResults(h.state).some((r) => r.jeanLawLocked)).toBe(false);
    }
  });
});

describe("matchSummary", () => {
  it("counts round wins and lists players with results", () => {
    const h = toEndgame(NO_SETH, "GREEN");
    h.dispatch({ type: "GUESS", playerId: "p4", targetId: "p3" });
    const summary = matchSummary(h.state);
    expect(summary).toMatchObject({ playerCount: 6, roundsGreen: 3, roundsRed: 0 });
    expect(summary.outcome.winner).toBe("GREEN");
    expect(summary.players).toHaveLength(6);
    expect(summary.rounds).toHaveLength(3);
  });

  it("records every nomination by seat, with each vote's weight", () => {
    const h = toEndgame(WITH_SETH, "GREEN");
    h.advanceTo("POST_GAME");
    const summary = matchSummary(h.state);
    expect(summary.nominations).toHaveLength(3);
    const first = summary.nominations[0];
    expect(first?.ministerSeats).toEqual([0, 1, 2]);
    expect(first?.votes.map((v) => v.seat)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(first?.votes.find((v) => v.seat === 4)?.weight).toBe(2); // Saint Frais
    expect(first?.votes.find((v) => v.seat === 0)?.weight).toBe(1);
  });

  it("keeps timed-out nominations with no ministers", () => {
    const h = new Harness(6, 1, 30, NO_SETH);
    h.advanceTo("SELECTION");
    h.timeout();
    for (let i = 0; i < 3; i++) h.playRound("SUCCESS");
    h.advanceTo("POST_GAME");
    expect(matchSummary(h.state).nominations[0]).toMatchObject({ ministerSeats: null, approved: false, votes: [] });
  });

  it("throws before the match ends", () => {
    expect(() => matchSummary(new Harness().state)).toThrow();
  });
});
