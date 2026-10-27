import { describe, expect, it } from "vitest";
import { publicView, viewFor } from "../src/vision/viewFor.js";
import { NO_SETH, WITH_SETH, toEndgame } from "./fixtures.js";
import { Harness, eventsOfType } from "./helpers.js";

function guess(h: Harness, playerId: string, targetId: string) {
  return h.dispatch({ type: "GUESS", playerId, targetId });
}

describe("Green wins on rounds", () => {
  it("asks Mir Jafar to guess, with a 60 s timer", () => {
    const h = toEndgame(NO_SETH, "GREEN");
    expect(h.state.phase).toBe("ENDGAME");
    expect(h.state.endgame?.step).toBe("MIR_JAFAR_GUESS");
    expect(h.state.endsAt).toBe(h.now + 60_000);
    expect(eventsOfType(h.log, "GUESS_REQUESTED")).toEqual([
      { type: "GUESS_REQUESTED", step: "MIR_JAFAR_GUESS", provisionalWinner: "GREEN" },
    ]);
  });

  it("a correct Mir Jafar guess hands the win to Red", () => {
    const h = toEndgame(NO_SETH, "GREEN");
    guess(h, "p4", "p2");
    expect(h.state.phase).toBe("POST_GAME");
    expect(h.state.outcome).toMatchObject({ winner: "RED", reason: "MIR_JAFAR_GUESS", roundWinner: "GREEN" });
    expect(h.state.outcome?.mirJafarGuess).toEqual({ guesserId: "p4", targetId: "p2", correct: true });
  });

  it("a wrong Mir Jafar guess keeps Green's win", () => {
    const h = toEndgame(NO_SETH, "GREEN");
    guess(h, "p4", "p3");
    expect(h.state.outcome).toMatchObject({ winner: "GREEN", reason: "ROUNDS" });
    expect(eventsOfType(h.log, "GUESS_RESOLVED")[0]).toMatchObject({ correct: false, provisionalWinner: "GREEN" });
  });

  it("a timed-out guess fails", () => {
    const h = toEndgame(NO_SETH, "GREEN");
    h.timeout();
    expect(h.state.outcome).toMatchObject({ winner: "GREEN" });
    expect(h.state.outcome?.mirJafarGuess).toEqual({ guesserId: "p4", targetId: null, correct: false });
  });
});

describe("Jagat Seth", () => {
  it("guesses after Mir Jafar misses, needing Mir Jafar", () => {
    const h = toEndgame(WITH_SETH, "GREEN");
    guess(h, "p5", "p3"); // miss
    expect(h.state.endgame).toMatchObject({ step: "JAGAT_SETH_GUESS", provisionalWinner: "GREEN" });
    expect(h.state.phase).toBe("ENDGAME");
    guess(h, "p8", "p5"); // finds Mir Jafar
    expect(h.state.outcome).toMatchObject({ winner: "GOLD", reason: "JAGAT_SETH_GUESS" });
  });

  it("needs Rai Durlabh once Mir Jafar's guess flips the win to Red", () => {
    const h = toEndgame(WITH_SETH, "GREEN");
    guess(h, "p5", "p2"); // correct: W becomes Red
    expect(h.state.endgame?.provisionalWinner).toBe("RED");
    guess(h, "p8", "p5"); // Mir Jafar is now the wrong target
    expect(h.state.outcome).toMatchObject({ winner: "RED", reason: "MIR_JAFAR_GUESS" });
  });

  it("wins alone by finding Rai Durlabh after Mir Jafar's correct guess", () => {
    const h = toEndgame(WITH_SETH, "GREEN");
    guess(h, "p5", "p2");
    guess(h, "p8", "p6");
    expect(h.state.outcome?.winner).toBe("GOLD");
  });

  it("guesses straight away when Red wins on rounds", () => {
    const h = toEndgame(WITH_SETH, "RED");
    expect(h.state.endgame).toMatchObject({ step: "JAGAT_SETH_GUESS", roundWinner: "RED", mirJafarGuess: null });
    guess(h, "p8", "p6");
    expect(h.state.outcome).toMatchObject({ winner: "GOLD", roundWinner: "RED" });
  });

  it("a wrong guess leaves Red's round win", () => {
    const h = toEndgame(WITH_SETH, "RED");
    guess(h, "p8", "p5");
    expect(h.state.outcome).toMatchObject({ winner: "RED", reason: "ROUNDS" });
  });

  it("a timed-out guess fails", () => {
    const h = toEndgame(WITH_SETH, "RED");
    h.timeout();
    expect(h.state.outcome?.jagatSethGuess).toEqual({ guesserId: "p8", targetId: null, correct: false });
    expect(h.state.outcome?.winner).toBe("RED");
  });

  it("each guess gets its own fresh 60 s", () => {
    const h = toEndgame(WITH_SETH, "GREEN");
    h.now += 50_000;
    guess(h, "p5", "p3");
    expect(h.state.endsAt).toBe(h.now + 60_000);
  });
});

describe("no guessers", () => {
  it("Red wins on rounds without Jagat Seth: straight to POST_GAME", () => {
    const h = toEndgame(NO_SETH, "RED");
    expect(h.state.phase).toBe("POST_GAME");
    expect(h.state.outcome).toMatchObject({ winner: "RED", reason: "ROUNDS", mirJafarGuess: null });
    expect(eventsOfType(h.log, "GUESS_REQUESTED")).toEqual([]);
  });
});

describe("GUESS validation", () => {
  const code = (h: Harness, playerId: string, targetId: string) =>
    eventsOfType(guess(h, playerId, targetId), "ACTION_REJECTED")[0]?.code;

  it("only the current guesser may guess", () => {
    const h = toEndgame(WITH_SETH, "GREEN");
    expect(code(h, "p8", "p5")).toBe("NOT_YOUR_GUESS"); // Jagat Seth waits for Mir Jafar
    expect(code(h, "p0", "p2")).toBe("NOT_YOUR_GUESS");
  });

  it("needs another player as the target", () => {
    const h = toEndgame(NO_SETH, "GREEN");
    expect(code(h, "p4", "p4")).toBe("INVALID_TARGET");
    expect(code(h, "p4", "ghost")).toBe("INVALID_TARGET");
  });

  it("is rejected outside the endgame", () => {
    const h = new Harness(6, 1, 30, NO_SETH);
    expect(code(h, "p4", "p2")).toBe("WRONG_PHASE");
  });

  it("can't be repeated after the match ends", () => {
    const h = toEndgame(NO_SETH, "GREEN");
    guess(h, "p4", "p3");
    expect(code(h, "p4", "p2")).toBe("WRONG_PHASE");
  });
});

describe("endgame views", () => {
  it("prompts only the current guesser", () => {
    const h = toEndgame(WITH_SETH, "GREEN");
    expect(viewFor(h.state, "p5").pending.guess).toBe("MIR_JAFAR_GUESS");
    expect(viewFor(h.state, "p8").pending.guess).toBeNull();
    guess(h, "p5", "p3");
    expect(viewFor(h.state, "p8").pending.guess).toBe("JAGAT_SETH_GUESS");
    expect(viewFor(h.state, "p5").pending.guess).toBeNull();
  });

  it("never tells Jagat Seth who Mir Jafar is", () => {
    const h = toEndgame(WITH_SETH, "GREEN");
    guess(h, "p5", "p3");
    const view = viewFor(h.state, "p8");
    expect(view.game.endgame?.mirJafarGuess).toEqual({ targetId: "p3", correct: false });
    expect(JSON.stringify(view)).not.toContain("guesserId");
    expect(view.game.outcome).toBeNull();
    expect(view.vision).toEqual([]);
  });

  it("shows every result in POST_GAME", () => {
    const h = toEndgame(NO_SETH, "GREEN");
    guess(h, "p4", "p3");
    const results = publicView(h.state).results;
    expect(results?.map((r) => [r.playerId, r.won])).toEqual([
      ["p0", true], ["p1", true], ["p2", true], ["p3", true], ["p4", false], ["p5", false],
    ]);
  });

  it("has no results before POST_GAME", () => {
    expect(publicView(toEndgame(NO_SETH, "GREEN").state).results).toBeNull();
  });
});
