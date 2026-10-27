import type { GameState, Headcount, NominationRecord, Vote } from "../types.js";

export interface BallotResultsCard {
  round: number;
  attempt: number;
  leaderSeat: number;
  /** Null when the Leader timed out without nominating. */
  ministerIds: string[] | null;
  approved: boolean;
  /** Every vote, in seat order. */
  votes: Array<{ playerId: string; seat: number; vote: Vote }>;
  /** Raw headcount; weighted totals are deliberately left out (§4.4). */
  headcount: Headcount;
}

/** The public results card for one nomination attempt. */
export function ballotResultsCard(state: GameState, record: NominationRecord): BallotResultsCard {
  const votes = state.players
    .filter((p) => record.votes[p.id] !== undefined)
    .map((p) => ({ playerId: p.id, seat: p.seat, vote: record.votes[p.id] as Vote }));

  const headcount: Headcount = {
    approve: votes.filter((v) => v.vote === "APPROVE").length,
    reject: votes.filter((v) => v.vote === "REJECT").length,
  };

  return {
    round: record.round,
    attempt: record.attempt,
    leaderSeat: record.leaderSeat,
    ministerIds: record.ministerIds ? [...record.ministerIds] : null,
    approved: record.approved,
    votes,
    headcount,
  };
}

/** The card for the most recent nomination, or null before the first one. */
export function lastBallotResultsCard(state: GameState): BallotResultsCard | null {
  const last = state.nominations.at(-1);
  return last ? ballotResultsCard(state, last) : null;
}
