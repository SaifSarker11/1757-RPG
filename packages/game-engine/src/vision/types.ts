import type {
  Card,
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
  roundResults: RoundResult[];
  outcome: GameOutcome | null;
}

export interface PendingActions {
  nominate: { teamSize: number } | null;
  vote: boolean;
  playCard: boolean;
  deBussyReveal: boolean;
  jeanLawLock: boolean;
}

export interface PlayerView {
  me: PlayerState;
  vision: VisionEntry[];
  reveals: RevealEntry[];
  /** Jean Law's own lock target; null for everyone else. */
  jeanLawTargetId: string | null;
  myVote: Vote | null;
  myCard: Card | null;
  pending: PendingActions;
  game: PublicView;
}
