import { deBussyReveal } from "./abilities/deBussy.js";
import { jeanLawLock } from "./abilities/jeanLaw.js";
import { castVote, ballotTimedOut } from "./phases/ballot.js";
import { enterPhase, type Step } from "./phases/common.js";
import { endgameTimedOut, guess } from "./phases/endgame.js";
import { playCard, resolutionTimedOut } from "./phases/mission.js";
import { nominate, selectionTimedOut } from "./phases/nomination.js";
import { isPaused, pause, resume } from "./phases/pause.js";
import { finishRound } from "./phases/round.js";
import type { Rng } from "./rng.js";
import type { Action, ErrorCode, GameState, ReduceResult } from "./types.js";

/**
 * Pure state transition. Never mutates `state`; returns the next state and the
 * events to emit. Invalid actions leave the state unchanged and produce a
 * single ACTION_REJECTED event addressed to the actor.
 */
export function reduce(state: GameState, action: Action, now: number, rng: Rng): ReduceResult {
  const step: Step = { state: structuredClone(state), events: [], now };

  if (action.type === "TICK" || action.type === "SKIP") {
    tick(step, rng, action.type === "SKIP");
    return { state: step.state, events: step.events };
  }
  if (action.type === "PAUSE" || action.type === "RESUME") {
    (action.type === "PAUSE" ? pause : resume)(step);
    return { state: step.state, events: step.events };
  }

  // While paused the game is frozen: nobody can act until the host resumes.
  const error = isPaused(state) ? "GAME_PAUSED" : applyPlayerAction(step, action, rng);
  if (error) {
    return { state, events: [{ type: "ACTION_REJECTED", playerId: action.playerId, code: error }] };
  }
  return { state: step.state, events: step.events };
}

function applyPlayerAction(
  step: Step,
  action: Exclude<Action, { type: "TICK" | "SKIP" | "PAUSE" | "RESUME" }>,
  rng: Rng
): ErrorCode | null {
  switch (action.type) {
    case "NOMINATE":
      return nominate(step, action.playerId, action.ministerIds);
    case "CAST_VOTE":
      return castVote(step, action.playerId, action.vote);
    case "PLAY_CARD":
      return playCard(step, rng, action.playerId, action.card);
    case "DEBUSSY_REVEAL":
      return deBussyReveal(step, action.playerId, action.targetId);
    case "JEANLAW_LOCK":
      return jeanLawLock(step, action.playerId, action.targetId);
    case "GUESS":
      return guess(step, action.playerId, action.targetId);
  }
}

/**
 * Applies the timeout of the current phase once `now` has reached `endsAt`,
 * or straight away when `force` is set (a host skip). A paused timer never
 * runs out; skipping while paused ends the phase and clears the pause.
 */
function tick(step: Step, rng: Rng, force = false): void {
  const { state } = step;
  if (isPaused(state)) {
    if (!force) return;
    state.pausedRemainingMs = null;
  } else if (state.endsAt === null || (!force && step.now < state.endsAt)) {
    return;
  }

  switch (state.phase) {
    case "ROLE_REVEAL":
      enterPhase(step, "DISCUSSION");
      return;
    case "DISCUSSION":
      enterPhase(step, "SELECTION");
      return;
    case "SELECTION":
      selectionTimedOut(step);
      return;
    case "BALLOT":
      ballotTimedOut(step);
      return;
    case "RESOLUTION":
      resolutionTimedOut(step, rng);
      return;
    case "ROUND_RESULT":
      finishRound(step);
      return;
    case "ENDGAME":
      endgameTimedOut(step);
      return;
    case "POST_GAME":
      return;
  }
}
