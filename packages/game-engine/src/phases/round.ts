import { ROUNDS_TO_WIN } from "../config/gameConfig.js";
import type { RoundResult, RoundWinner } from "../types.js";
import { enterPhase, startNominationAttempt, type Step } from "./common.js";

/** Stores the round's result and shows it in ROUND_RESULT. */
export function recordRoundResult(step: Step, result: RoundResult): void {
  step.state.roundResults.push(result);
  step.state.failTrack = 0;
  enterPhase(step, "ROUND_RESULT");
}

export function roundWins(results: readonly RoundResult[], team: RoundWinner): number {
  return results.filter((r) => r.winner === team).length;
}

/** Leaving ROUND_RESULT: end the match at 3 wins, otherwise start the next round. */
export function finishRound(step: Step): void {
  const { state } = step;
  const green = roundWins(state.roundResults, "GREEN");
  const red = roundWins(state.roundResults, "RED");

  if (green >= ROUNDS_TO_WIN || red >= ROUNDS_TO_WIN) {
    startEndgame(step, green >= ROUNDS_TO_WIN ? "GREEN" : "RED");
    return;
  }

  state.round += 1;
  state.attempt = 1;
  startNominationAttempt(step);
}

/**
 * The match is decided on rounds. Mir Jafar's and Jagat Seth's guesses (§4.6)
 * are added by the endgame module; until then the round winner is final.
 */
export function startEndgame(step: Step, roundWinner: RoundWinner): void {
  const outcome = { winner: roundWinner, reason: "ROUNDS" } as const;
  step.state.outcome = outcome;
  enterPhase(step, "POST_GAME");
  step.events.push({ type: "GAME_ENDED", outcome });
}
