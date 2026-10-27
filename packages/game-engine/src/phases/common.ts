import { PHASE_SECONDS } from "../config/gameConfig.js";
import type { GameEvent, GameState, Phase, PlayerState } from "../types.js";

/** Mutable working context for a single reduce step. */
export interface Step {
  state: GameState;
  events: GameEvent[];
  now: number;
}

export function phaseSeconds(state: GameState, phase: Phase): number | null {
  if (phase === "DISCUSSION") {
    return state.settings.roundDiscussionSeconds?.[state.round - 1] ?? state.settings.discussionSeconds;
  }
  if (phase === "POST_GAME") return null;
  return PHASE_SECONDS[phase];
}

export function enterPhase(step: Step, phase: Phase): void {
  const { state } = step;
  const seconds = phaseSeconds(state, phase);
  state.phase = phase;
  state.endsAt = seconds === null ? null : step.now + seconds * 1000;
  step.events.push({
    type: "PHASE_CHANGED",
    phase,
    round: state.round,
    leaderSeat: state.leaderSeat,
    endsAt: state.endsAt,
  });
}

/** Clears the per-nomination fields and opens a new Discussion. */
export function startNominationAttempt(step: Step): void {
  const { state } = step;
  state.ministerIds = [];
  state.votes = {};
  state.cards = {};
  enterPhase(step, "DISCUSSION");
}

export function findPlayer(state: GameState, playerId: string): PlayerState | undefined {
  return state.players.find((p) => p.id === playerId);
}

export function leader(state: GameState): PlayerState | undefined {
  return state.players.find((p) => p.seat === state.leaderSeat);
}

export function rotateLeader(state: GameState): void {
  state.leaderSeat = (state.leaderSeat + 1) % state.players.length;
}
