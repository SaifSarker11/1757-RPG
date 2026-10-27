import type { BallotResultsCard } from "../phases/resultsCard.js";
import type { PlayerResult } from "../scoring.js";
import type {
  Card,
  EndgameStep,
  RoundWinner,
  GameOutcome,
  NominationRecord,
  Phase,
  PlayerState,
  RoleId,
  RoundResult,
  Team,
  Vote,
} from "../types.js";

/** What a viewer is told about another player. */
export type VisionLabel =
  /** "This player is <role>". May be a decoy (Tara Bai). */
  | { kind: "ROLE"; role: RoleId }
  /** A Red badge, without the role. */
  | { kind: "RED" }
  /** One of several candidates; the viewer can't tell which is which (Mohon Lal). */
  | { kind: "SUSPECT" };

export interface VisionEntry {
  playerId: string;
  seat: number;
  label: VisionLabel;
}

/** A role learned through an ability (de Bussy). */
export interface RevealEntry {
  playerId: string;
  seat: number;
  role: RoleId;
  source: "DE_BUSSY";
}

export interface PublicPlayer {
  id: string;
  seat: number;
  /** Only present in POST_GAME. */
  role?: RoleId;
  team?: Team;
}

/** Everything every player (and spectator) may see. */
export interface PublicView {
  phase: Phase;
  round: number;
  attempt: number;
  endsAt: number | null;
  /** Custom rooms: time left on the frozen timer while the host has paused; null otherwise. */
  pausedRemainingMs: number | null;
  leaderSeat: number;
  failTrack: number;
  teamSize: number;
  players: PublicPlayer[];
  ministerIds: string[];
  /** Who has voted in the current ballot, without the votes. */
  votedIds: string[];
  /** Which ministers have played a card, without the cards. */
  playedIds: string[];
  nominations: NominationRecord[];
  /** Results card for the most recent nomination attempt. */
  lastBallot: BallotResultsCard | null;
  roundResults: RoundResult[];
  endgame: PublicEndgame | null;
  outcome: GameOutcome | null;
  /** Per-player win credit; only in POST_GAME. */
  results: PlayerResult[] | null;
}

export interface PublicGuess {
  targetId: string | null;
  correct: boolean;
}

/**
 * Endgame progress without the guessers' ids: Jagat Seth may have to find
 * Mir Jafar, so who guessed first must stay hidden until POST_GAME.
 */
export interface PublicEndgame {
  step: EndgameStep | null;
  roundWinner: RoundWinner;
  provisionalWinner: RoundWinner;
  mirJafarGuess: PublicGuess | null;
  jagatSethGuess: PublicGuess | null;
}

export interface PendingActions {
  nominate: { teamSize: number } | null;
  vote: boolean;
  playCard: boolean;
  /** Cards this player may play right now; empty unless `playCard`. */
  allowedCards: Card[];
  deBussyReveal: boolean;
  jeanLawLock: boolean;
  /** The endgame guess this player must make now, if any. */
  guess: EndgameStep | null;
}

export interface PlayerView {
  me: PlayerState;
  vision: VisionEntry[];
  reveals: RevealEntry[];
  /** Jean Law's own lock target; null for everyone else. */
  jeanLawTargetId: string | null;
  myVote: Vote | null;
  /** This player's own ballot weight (2 for Saint Frais / Yar Lutuf). */
  myVoteWeight: number;
  myCard: Card | null;
  pending: PendingActions;
  game: PublicView;
}
