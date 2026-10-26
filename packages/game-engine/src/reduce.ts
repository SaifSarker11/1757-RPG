import { castVote, ballotTimedOut } from "./phases/ballot.js";
import { enterPhase, type Step } from "./phases/common.js";
import { playCard, resolutionTimedOut } from "./phases/mission.js";
import { nominate, selectionTimedOut } from "./phases/nomination.js";
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

  if (action.type === "TICK") {
    tick(step, rng);
    return { state: step.state, events: step.events };
  }

  const error = applyPlayerAction(step, action, rng);
  if (error) {
    return { state, events: [{ type: "ACTION_REJECTED", playerId: action.playerId, code: error }] };
  }
  return { state: step.state, events: step.events };
}

function applyPlayerAction(
  step: Step,
  action: Exclude<Action, { type: "TICK" }>,
  rng: Rng
): ErrorCode | null {
  switch (action.type) {
    case "NOMINATE":
      return nominate(step, action.playerId, action.ministerIds);
    case "CAST_VOTE":
      return castVote(step, action.playerId, action.vote);
    case "PLAY_CARD":
      return playCard(step, rng, action.playerId, action.card);
  }
}

/** Applies the timeout of the current phase once `now` has reached `endsAt`. */
function tick(step: Step, rng: Rng): void {
  const { state } = step;
  if (state.endsAt === null || step.now < state.endsAt) return;

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
    case "POST_GAME":
      return;
  }
}
