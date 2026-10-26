/**
 * Types representing the authoritative server view sent as `game:view` to each player.
 */

export interface PublicPlayer {
  id: string;
  seat: number;
  role?: string;
  team?: string;
}

export interface NominationVote {
  seat: number;
  vote: "APPROVE" | "REJECT";
  weight: number;
}

export interface PublicNomination {
  round: number;
  attempt: number;
  leaderSeat: number;
  ministerSeats: number[];
  approved: boolean;
  votes: NominationVote[];
}

export interface BallotCardVote {
  seat: number;
  vote: "APPROVE" | "REJECT";
  weight: number;
}

export interface LastBallotCard {
  round: number;
  attempt: number;
  approved: boolean;
  headcount: { approve: number; reject: number };
  votes: BallotCardVote[];
}

export interface RoundResultSummary {
  round: number;
  winner: "GREEN" | "RED";
  reason: "MISSION" | "DEADLOCK";
  successCount: number;
  sabotageCount: number;
}

export interface PublicEndgame {
  step: "MIR_JAFAR_GUESS" | "JAGAT_SETH_GUESS";
  roundWinner: "GREEN" | "RED";
  provisionalWinner: "GREEN" | "RED" | "GOLD";
  mirJafarGuess: { targetId: string; correct: boolean } | null;
  jagatSethGuess: { targetId: string; correct: boolean } | null;
}

export interface PublicView {
  phase:
    | "ROLE_REVEAL"
    | "DISCUSSION"
    | "SELECTION"
    | "BALLOT"
    | "RESOLUTION"
    | "ROUND_RESULT"
    | "ENDGAME"
    | "POST_GAME";
  round: number;
  attempt: number;
  endsAt: number | null;
  leaderSeat: number;
  failTrack: number;
  teamSize: number;
  players: PublicPlayer[];
  ministerIds: string[];
  votedIds: string[];
  playedIds: string[];
  nominations: PublicNomination[];
  lastBallot: LastBallotCard | null;
  roundResults: RoundResultSummary[];
  endgame: PublicEndgame | null;
  outcome: {
    winner: "GREEN" | "RED" | "GOLD";
    reason: string;
    mirJafarGuess: { targetId: string; correct: boolean } | null;
    jagatSethGuess: { targetId: string; correct: boolean } | null;
  } | null;
  results: Record<
    string,
    {
      seat: number;
      role: string;
      team: string;
      won: boolean;
      jeanLawLocked: boolean;
      disconnectedForfeit: boolean;
    }
  > | null;
}

export interface PendingActions {
  nominate: { teamSize: number } | null;
  vote: boolean;
  playCard: boolean;
  allowedCards: Array<"SUCCESS" | "SABOTAGE">;
  deBussyReveal: boolean;
  jeanLawLock: boolean;
  guess: "MIR_JAFAR_GUESS" | "JAGAT_SETH_GUESS" | null;
}

export interface VisionRoleDetails {
  apparentRole?: string;
  apparentTeam?: string;
  suspects?: string[];
  seenRoles?: Record<string, string>;
}

export interface PlayerView {
  me: {
    id: string;
    seat: number;
    role: string;
    team: string;
  };
  vision: Record<string, VisionRoleDetails>;
  reveals: Record<string, string>;
  jeanLawTargetId: string | null;
  myVote: "APPROVE" | "REJECT" | null;
  myVoteWeight: number;
  myCard: "SUCCESS" | "SABOTAGE" | null;
  pending: PendingActions;
  game: PublicView;
}
