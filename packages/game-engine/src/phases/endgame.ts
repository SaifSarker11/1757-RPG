import { JAGAT_SETH_TARGET, MIR_JAFAR_TARGET } from "../config/gameConfig.js";
import type {
  EndgameState,
  EndgameStep,
  ErrorCode,
  GameState,
  NamedRoleId,
  OutcomeReason,
  RoundWinner,
  Team,
} from "../types.js";
import { enterPhase, findPlayer, type Step } from "./common.js";

const GUESSER: Readonly<Record<EndgameStep, NamedRoleId>> = {
  MIR_JAFAR_GUESS: "MIR_JAFAR",
  JAGAT_SETH_GUESS: "JAGAT_SETH",
};

function hasRole(state: GameState, role: NamedRoleId): boolean {
  return state.players.some((p) => p.role === role);
}

function guesserFor(state: GameState, step: EndgameStep) {
  return state.players.find((p) => p.role === GUESSER[step]);
}

function endgameOf(state: GameState): EndgameState {
  if (!state.endgame) throw new Error("Endgame has not started");
  return state.endgame;
}

/**
 * A faction reached 3 round wins (§4.6). Runs Mir Jafar's guess if Green won
 * on rounds, then Jagat Seth's if he is in the game, then ends the match.
 */
export function startEndgame(step: Step, roundWinner: RoundWinner): void {
  const { state } = step;
  state.endgame = {
    step: null,
    roundWinner,
    provisionalWinner: roundWinner,
    mirJafarGuess: null,
    jagatSethGuess: null,
  };

  if (roundWinner === "GREEN" && hasRole(state, "MIR_JAFAR")) {
    requestGuess(step, "MIR_JAFAR_GUESS");
  } else {
    afterMirJafar(step);
  }
}

function requestGuess(step: Step, guess: EndgameStep): void {
  const endgame = endgameOf(step.state);
  endgame.step = guess;
  enterPhase(step, "ENDGAME");
  step.events.push({
    type: "GUESS_REQUESTED",
    step: guess,
    provisionalWinner: endgame.provisionalWinner,
  });
}

function afterMirJafar(step: Step): void {
  if (hasRole(step.state, "JAGAT_SETH")) {
    requestGuess(step, "JAGAT_SETH_GUESS");
  } else {
    const endgame = endgameOf(step.state);
    finish(step, endgame.provisionalWinner, endgame.mirJafarGuess?.correct ? "MIR_JAFAR_GUESS" : "ROUNDS");
  }
}

export function guess(step: Step, playerId: string, targetId: string): ErrorCode | null {
  const { state } = step;
  const actor = findPlayer(state, playerId);
  if (!actor) return "NOT_IN_GAME";
  if (state.phase !== "ENDGAME" || !state.endgame?.step) return "WRONG_PHASE";
  if (actor.role !== GUESSER[state.endgame.step]) return "NOT_YOUR_GUESS";
  if (targetId === playerId || !findPlayer(state, targetId)) return "INVALID_TARGET";

  resolveGuess(step, targetId);
  return null;
}

/** ENDGAME ran out: the pending guess fails (§4.5). */
export function endgameTimedOut(step: Step): void {
  resolveGuess(step, null);
}

function resolveGuess(step: Step, targetId: string | null): void {
  const { state } = step;
  const endgame = endgameOf(state);
  const current = endgame.step;
  if (!current) return;

  const guesser = guesserFor(state, current);
  const target = targetId ? findPlayer(state, targetId) : undefined;
  const wanted =
    current === "MIR_JAFAR_GUESS" ? MIR_JAFAR_TARGET : JAGAT_SETH_TARGET[endgame.provisionalWinner];
  const correct = target?.role === wanted;
  const record = { guesserId: guesser?.id ?? "", targetId, correct };

  if (current === "MIR_JAFAR_GUESS") {
    endgame.mirJafarGuess = record;
    if (correct) endgame.provisionalWinner = "RED";
  } else {
    endgame.jagatSethGuess = record;
  }
  endgame.step = null;

  step.events.push({
    type: "GUESS_RESOLVED",
    step: current,
    targetId,
    correct,
    provisionalWinner: endgame.provisionalWinner,
  });

  if (current === "MIR_JAFAR_GUESS") {
    afterMirJafar(step);
  } else if (correct) {
    finish(step, "GOLD", "JAGAT_SETH_GUESS");
  } else {
    finish(step, endgame.provisionalWinner, endgame.mirJafarGuess?.correct ? "MIR_JAFAR_GUESS" : "ROUNDS");
  }
}

function finish(step: Step, winner: Team, reason: OutcomeReason): void {
  const endgame = endgameOf(step.state);
  const outcome = {
    winner,
    reason,
    roundWinner: endgame.roundWinner,
    mirJafarGuess: endgame.mirJafarGuess,
    jagatSethGuess: endgame.jagatSethGuess,
  };
  step.state.outcome = outcome;
  enterPhase(step, "POST_GAME");
  step.events.push({ type: "GAME_ENDED", outcome });
}
