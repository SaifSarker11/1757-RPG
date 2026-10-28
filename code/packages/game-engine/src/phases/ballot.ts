import { TIMEOUT_DEFAULTS, ballotWeight } from "../config/gameConfig.js";
import type { ErrorCode, GameState, Headcount, Vote } from "../types.js";
import { enterPhase, findPlayer, type Step } from "./common.js";
import { closeNomination, continueAfterRejection } from "./nomination.js";

export interface BallotTally {
  /** Weighted totals. Internal only; never put these in an event. */
  approve: number;
  reject: number;
  /** One per voter, regardless of weight. */
  headcount: Headcount;
  approved: boolean;
}

/**
 * Weighted Approve vs Reject (§1, §4.4). Ties are rejected [DEFAULT].
 * `weightOf` defaults to 1 per voter.
 */
export function tallyBallot(
  votes: Readonly<Record<string, Vote>>,
  weightOf: (playerId: string) => number = () => 1
): BallotTally {
  const headcount: Headcount = { approve: 0, reject: 0 };
  let approve = 0;
  let reject = 0;
  for (const [playerId, vote] of Object.entries(votes)) {
    const weight = weightOf(playerId);
    if (vote === "APPROVE") {
      approve += weight;
      headcount.approve += 1;
    } else {
      reject += weight;
      headcount.reject += 1;
    }
  }
  return { approve, reject, headcount, approved: approve > reject };
}

export function voteWeightOf(state: GameState, playerId: string): number {
  const player = findPlayer(state, playerId);
  return player ? ballotWeight(player.role) : 0;
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
  const { approved, headcount } = tallyBallot(state.votes, (id) => voteWeightOf(state, id));
  const votes = { ...state.votes };

  closeNomination(step, approved);
  step.events.push({
    type: "BALLOT_RESOLVED",
    approved,
    votes,
    headcount,
    failTrack: state.failTrack,
  });

  if (approved) {
    enterPhase(step, "RESOLUTION");
  } else {
    continueAfterRejection(step);
  }
}
