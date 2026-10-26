import { TIMEOUT_DEFAULTS } from "../config/gameConfig.js";
import type { ErrorCode, Vote } from "../types.js";
import { enterPhase, findPlayer, type Step } from "./common.js";
import { closeNomination, continueAfterRejection } from "./nomination.js";

export interface BallotTally {
  approve: number;
  reject: number;
  approved: boolean;
}

/** Ties are rejected [DEFAULT]. */
export function tallyBallot(votes: Readonly<Record<string, Vote>>): BallotTally {
  let approve = 0;
  let reject = 0;
  for (const vote of Object.values(votes)) {
    if (vote === "APPROVE") approve += 1;
    else reject += 1;
  }
  return { approve, reject, approved: approve > reject };
}

export function castVote(step: Step, playerId: string, vote: Vote): ErrorCode | null {
  const { state } = step;
  if (!findPlayer(state, playerId)) return "NOT_IN_GAME";
  if (state.phase !== "BALLOT") return "WRONG_PHASE";
  if (state.votes[playerId] !== undefined) return "ALREADY_VOTED";

  state.votes[playerId] = vote;
  step.events.push({ type: "VOTE_CAST", playerId });

  if (Object.keys(state.votes).length === state.players.length) {
    resolveBallot(step);
  }
  return null;
}

/** BALLOT ran out: missing votes count as Approve (§4.5). */
export function ballotTimedOut(step: Step): void {
  const { state } = step;
  for (const player of state.players) {
    state.votes[player.id] ??= TIMEOUT_DEFAULTS.vote;
  }
  resolveBallot(step);
}

function resolveBallot(step: Step): void {
  const { state } = step;
  const { approved } = tallyBallot(state.votes);
  const votes = { ...state.votes };

  closeNomination(step, approved);
  step.events.push({ type: "BALLOT_RESOLVED", approved, votes, failTrack: state.failTrack });

  if (approved) {
    enterPhase(step, "RESOLUTION");
  } else {
    continueAfterRejection(step);
  }
}
