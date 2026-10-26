export type Team = "GREEN" | "RED" | "GOLD";

/** Faction that can win a round. Gold never wins rounds. */
export type RoundWinner = "GREEN" | "RED";

/** Role ids match the Prisma `PlayerRole` enum, plus the two filler roles. */
export type NamedRoleId =
  | "NAWAB_SIRAJ"
  | "LUTFUNNESA"
  | "MIR_MADAN"
  | "MOHON_LAL"
  | "SAINT_FRASY"
  | "DE_BUSSY"
  | "RAJA_RAMNARAIN"
  | "MIR_JAFAR"
  | "UMICHAD"
  | "JEAN_LAW"
  | "GHASHETI_BEGUM"
  | "YAR_LUTUF"
  | "TARA_BAI"
  | "RAI_DURLABH"
  | "JAGAT_SETH";

export type FillerRoleId = "LOYALIST" | "EIC_SPY";

export type RoleId = NamedRoleId | FillerRoleId;

export type Phase =
  | "ROLE_REVEAL"
  | "DISCUSSION"
  | "SELECTION"
  | "BALLOT"
  | "RESOLUTION"
  | "ROUND_RESULT"
  | "ENDGAME"
  | "POST_GAME";

export type Vote = "APPROVE" | "REJECT";
export type Card = "SUCCESS" | "SABOTAGE";

export interface PlayerState {
  id: string;
  seat: number;
  role: RoleId;
  team: Team;
}

/** Host-controlled settings, validated before a game is created. */
export interface GameSettings {
  discussionSeconds: number;
  /** Named roles the host allows. Nawab Siraj is always included. */
  enabledRoles: readonly NamedRoleId[];
}

export interface NominationRecord {
  round: number;
  attempt: number;
  leaderSeat: number;
  /** Null when the Leader timed out without nominating. */
  ministerIds: string[] | null;
  votes: Record<string, Vote>;
  approved: boolean;
}

export type RoundResultReason = "MISSION" | "DEADLOCK";

export interface RoundResult {
  round: number;
  winner: RoundWinner;
  reason: RoundResultReason;
  successCount: number;
  sabotageCount: number;
}

export interface GameOutcome {
  winner: Team;
  reason: "ROUNDS";
}

/** Once-per-game abilities. Null until used. */
export interface AbilityState {
  deBussy: { targetId: string; round: number } | null;
  jeanLaw: { targetId: string; round: number } | null;
}

export interface GameState {
  players: PlayerState[];
  settings: GameSettings;
  phase: Phase;
  /** Epoch ms when the current phase times out; null when it has no timer. */
  endsAt: number | null;
  round: number;
  /** Nomination attempt within the current round, starting at 1. */
  attempt: number;
  leaderSeat: number;
  failTrack: number;
  ministerIds: string[];
  votes: Record<string, Vote>;
  cards: Record<string, Card>;
  roundResults: RoundResult[];
  nominations: NominationRecord[];
  abilities: AbilityState;
  outcome: GameOutcome | null;
}

export type Action =
  | { type: "TICK" }
  | { type: "NOMINATE"; playerId: string; ministerIds: string[] }
  | { type: "CAST_VOTE"; playerId: string; vote: Vote }
  | { type: "PLAY_CARD"; playerId: string; card: Card }
  | { type: "DEBUSSY_REVEAL"; playerId: string; targetId: string }
  | { type: "JEANLAW_LOCK"; playerId: string; targetId: string };

export type ErrorCode =
  | "WRONG_PHASE"
  | "NOT_IN_GAME"
  | "NOT_LEADER"
  | "INVALID_TEAM_SIZE"
  | "UNKNOWN_PLAYER"
  | "DUPLICATE_PLAYER"
  | "ALREADY_VOTED"
  | "NOT_A_MINISTER"
  | "ALREADY_PLAYED"
  | "NOT_YOUR_ABILITY"
  | "ABILITY_ALREADY_USED"
  | "INVALID_TARGET";

export type GameEvent =
  | {
      type: "PHASE_CHANGED";
      phase: Phase;
      round: number;
      leaderSeat: number;
      endsAt: number | null;
    }
  | { type: "NOMINATION_MADE"; leaderSeat: number; ministerIds: string[] }
  | { type: "NOMINATION_TIMED_OUT"; leaderSeat: number }
  | { type: "VOTE_CAST"; playerId: string }
  | {
      type: "BALLOT_RESOLVED";
      approved: boolean;
      votes: Record<string, Vote>;
      failTrack: number;
    }
  | { type: "CARD_PLAYED"; playerId: string }
  | {
      type: "MISSION_RESOLVED";
      round: number;
      /** Shuffled so the reveal order says nothing about who played what. */
      cards: Card[];
      successCount: number;
      sabotageCount: number;
      winner: RoundWinner;
    }
  | { type: "ROUND_DEADLOCKED"; round: number }
  | { type: "GAME_ENDED"; outcome: GameOutcome }
  /**
   * Private state changed for these players only. The server re-sends
   * `viewFor` to each of them; nothing else about it is public.
   */
  | { type: "PRIVATE_VIEW_CHANGED"; playerIds: string[] }
  | { type: "ACTION_REJECTED"; playerId: string; code: ErrorCode };

export interface ReduceResult {
  state: GameState;
  events: GameEvent[];
}
