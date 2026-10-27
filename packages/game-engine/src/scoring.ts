import { isJeanLawFlipped } from "./abilities/jeanLaw.js";
import { ballotWeight } from "./config/gameConfig.js";
import { roundWins } from "./phases/round.js";
import type {
  GameOutcome,
  GameSettings,
  GameState,
  RoleId,
  RoundResult,
  Team,
  Vote,
} from "./types.js";

export interface PlayerResult {
  playerId: string;
  seat: number;
  role: RoleId;
  team: Team;
  won: boolean;
  /** Jean Law locked this Green player: their win condition flipped (humiliation trophy). */
  jeanLawLocked: boolean;
}

/**
 * Final win credit (§4.6 step 3):
 * - Gold win: only Jagat Seth wins.
 * - Otherwise the winning faction wins and Jagat Seth loses.
 * - Jean Law's locked Green target wins only if Red won.
 */
export function playerResults(state: GameState): PlayerResult[] {
  const outcome = state.outcome;
  if (!outcome) throw new Error("The match has not ended");

  return state.players.map((p) => {
    const jeanLawLocked = isJeanLawFlipped(state, p.id);
    let won: boolean;
    if (outcome.winner === "GOLD") won = p.team === "GOLD";
    else if (p.team === "GOLD") won = false;
    else if (jeanLawLocked) won = outcome.winner === "RED";
    else won = p.team === outcome.winner;

    return { playerId: p.id, seat: p.seat, role: p.role, team: p.team, won, jeanLawLocked };
  });
}

export interface SummaryBallotVote {
  seat: number;
  vote: Vote;
  /** Server-only: the weight is never sent to clients. */
  weight: number;
}

export interface SummaryNomination {
  round: number;
  attempt: number;
  leaderSeat: number;
  ministerSeats: number[] | null;
  approved: boolean;
  votes: SummaryBallotVote[];
}

/** Everything needed to show the post-game report and save the match. Server-only. */
export interface MatchSummary {
  playerCount: number;
  settings: GameSettings;
  outcome: GameOutcome;
  roundsGreen: number;
  roundsRed: number;
  players: PlayerResult[];
  rounds: RoundResult[];
  nominations: SummaryNomination[];
}

export function matchSummary(state: GameState): MatchSummary {
  const outcome = state.outcome;
  if (!outcome) throw new Error("The match has not ended");

  const seatOf = new Map(state.players.map((p) => [p.id, p.seat]));
  const roleOf = new Map(state.players.map((p) => [p.id, p.role]));
  const seat = (id: string) => seatOf.get(id) ?? -1;

  return {
    playerCount: state.players.length,
    settings: structuredClone(state.settings),
    outcome: structuredClone(outcome),
    roundsGreen: roundWins(state.roundResults, "GREEN"),
    roundsRed: roundWins(state.roundResults, "RED"),
    players: playerResults(state),
    rounds: structuredClone(state.roundResults),
    nominations: state.nominations.map((n) => ({
      round: n.round,
      attempt: n.attempt,
      leaderSeat: n.leaderSeat,
      ministerSeats: n.ministerIds ? n.ministerIds.map(seat) : null,
      approved: n.approved,
      votes: Object.entries(n.votes)
        .map(([id, vote]) => {
          const role = roleOf.get(id);
          return { seat: seat(id), vote, weight: role ? ballotWeight(role) : 1 };
        })
        .sort((a, b) => a.seat - b.seat),
    })),
  };
}
