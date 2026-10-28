import { FAIL_TRACK_LIMIT, getTeamSize } from "../config/gameConfig.js";
import type { ErrorCode } from "../types.js";
import { enterPhase, findPlayer, rotateLeader, startNominationAttempt, type Step } from "./common.js";
import { recordRoundResult } from "./round.js";

/** Validates and applies the Leader's nomination. Returns an error code on rejection. */
export function nominate(
  step: Step,
  playerId: string,
  ministerIds: readonly string[]
): ErrorCode | null {
  const { state } = step;
  const actor = findPlayer(state, playerId);
  if (!actor) return "NOT_IN_GAME";
  if (state.phase !== "SELECTION") return "WRONG_PHASE";
  if (actor.seat !== state.leaderSeat) return "NOT_LEADER";
  if (ministerIds.length !== getTeamSize(state.players.length, state.round)) {
    return "INVALID_TEAM_SIZE";
  }
  if (new Set(ministerIds).size !== ministerIds.length) return "DUPLICATE_PLAYER";
  if (ministerIds.some((id) => !findPlayer(state, id))) return "UNKNOWN_PLAYER";

  state.ministerIds = [...ministerIds];
  step.events.push({
    type: "NOMINATION_MADE",
    leaderSeat: state.leaderSeat,
    ministerIds: state.ministerIds,
  });
  enterPhase(step, "BALLOT");
  return null;
}

/**
 * Logs the nomination attempt, moves the fail track and passes leadership on.
 * Leadership rotates on every nomination, approved or not (§4.4).
 */
export function closeNomination(step: Step, approved: boolean): void {
  const { state } = step;
  state.nominations.push({
    round: state.round,
    attempt: state.attempt,
    leaderSeat: state.leaderSeat,
    ministerIds: state.ministerIds.length > 0 ? [...state.ministerIds] : null,
    votes: { ...state.votes },
    approved,
  });
  state.failTrack = approved ? 0 : state.failTrack + 1;
  rotateLeader(state);
}

/** After a rejected (or missing) nomination: deadlock at the limit, else try again. */
export function continueAfterRejection(step: Step): void {
  const { state } = step;
  if (state.failTrack >= FAIL_TRACK_LIMIT) {
    step.events.push({ type: "ROUND_DEADLOCKED", round: state.round });
    recordRoundResult(step, {
      round: state.round,
      winner: "RED",
      reason: "DEADLOCK",
      successCount: 0,
      sabotageCount: 0,
    });
    return;
  }
  state.attempt += 1;
  startNominationAttempt(step);
}

/** SELECTION ran out: counts as a rejected nomination (§4.5). */
export function selectionTimedOut(step: Step): void {
  step.events.push({ type: "NOMINATION_TIMED_OUT", leaderSeat: step.state.leaderSeat });
  closeNomination(step, false);
  continueAfterRejection(step);
}
