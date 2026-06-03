// Shared types across web, admin, api, mobile

export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  success: boolean;
};

export type PaginatedResponse<T> = ApiResponse<{
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}>;

// Socket event types (keep WS contracts in sync)
export type SocketEvents = {
  "game:join": { roomId: string; userId: string };
  "game:leave": { roomId: string; userId: string };
  "game:action": { roomId: string; action: string; payload: unknown };
  "chat:message": { roomId: string; userId: string; message: string };
  "room:join": { roomId: string; userId: string; socketId?: string };
  "room:leave": { roomId: string };
  "round:propose-team": { roomId: string; playerIds: string[] };
  "round:vote-team": { roundId: string; playerId: string; vote: "approve" | "reject" };
  "round:vote-mission": { roundId: string; playerId: string; vote: "green" | "red" };
  "round:phase": { phase: GamePhase; round: number; duration: number };
  "round:teamProposed": { playerIds: string[] };
  "round:approvalResult": { approved: boolean };
  "round:missionResult": { winner: "GREEN" | "RED" | "JAGAT_SETH"; greenVotes: number; redVotes: number };
  "round:transition": { round: number; selectorId: string };
  "game:endgame": { roomId: string };
  "game:end": { roomId: string; winner: "GREEN" | "RED" | "JAGAT_SETH"; roleReveal: Array<{ userId: string; role: string; team: string }> };
  "debussy:reveal": { targetUserId: string; revealedRole: string | null };
  "jeanlaw:lockConfirmed": { targetUserId: string };
  "round:mirMadanVision": { visiblePlayers: Array<{ userId: string; role: string; team: string }> };
};

// Room-related types
export type Room = {
  id: string;
  code: string;
  hostId: string;
  status: "WAITING" | "IN_PROGRESS" | "GREEN_WIN" | "RED_WIN" | "JAGAT_SETH_WIN";
  currentRound: number;
  greenWins: number;
  redWins: number;
  roundRejections: number;
  createdAt: string;
  updatedAt: string;
};

export type RoomPlayer = {
  id: string;
  roomId: string;
  userId: string;
  socketId?: string;
  role?: string;
  team?: "GREEN" | "RED" | "GOLD";
  isSelector: boolean;
  isLockedByJeanLaw: boolean;
  hasUsedDeBussyLock: boolean;
};

export type RoundRecord = {
  id: string;
  roomId: string;
  roundNumber: number;
  phase: "DISCUSSION" | "TEAM_PROPOSAL" | "TEAM_APPROVAL" | "MISSION_VOTE" | "TRANSITION";
  selectorId?: string;
  selectedTeam: string[];
  teamVotes?: Record<string, string>;
  missionVotes?: Record<string, string>;
  greenVotes: number;
  redVotes: number;
  winner?: "GREEN" | "RED" | "GOLD" | null;
  rejectionCount: number;
};

// Room status type
export type RoomStatus = "WAITING" | "IN_PROGRESS" | "FINISHED";

export type GamePhase =
  | "DISCUSSION"
  | "TEAM_PROPOSAL"
  | "TEAM_APPROVAL"
  | "MISSION_VOTE"
  | "TRANSITION"
  | "ENDGAME";

export interface RoundPhasePayload {
  phase: GamePhase;
  round: number;
  duration: number;
}

export interface TeamProposedPayload {
  playerIds: string[];
}

export interface ApprovalVotePayload {
  vote: "approve" | "reject";
}

export interface ApprovalResultPayload {
  approved: boolean;
}

export interface MissionVotePayload {
  vote: "green" | "red";
}

export interface MissionResultPayload {
  winner: "GREEN" | "RED" | "JAGAT_SETH";
  greenVotes: number;
  redVotes: number;
}

export interface TransitionPayload {
  round: number;
  selectorId: string;
}

export interface EndgameGuessPayload {
  targetUserId: string;
  guessType: "team" | "role";
}

export interface GameEndPayload {
  roomId: string;
  winner: "GREEN" | "RED" | "JAGAT_SETH";
  roleReveal: Array<{ userId: string; role: string; team: string }>;
  excludedWinCredit: string[];
}

export interface IRoom {
  id: string;
  hostUserId: string;
  status: RoomStatus;
  maxPlayers: number;
  currentRound: number;
  greenWins: number;
  redWins: number;
  players: IRoomPlayer[];
}

// IRoomPlayer interface
export interface IRoomPlayer {
  userId: string;
  roomId: string;
  role: string | null;
  team: string | null;
}

// RoomCreatePayload interface
export interface RoomCreatePayload {
  hostUserId: string;
  maxPlayers: number;
}

// RoomJoinPayload interface
export interface RoomJoinPayload {
  roomId: string;
  userId: string;
}

// RoomLeavePayload interface
export interface RoomLeavePayload {
  roomId: string;
  userId: string; 
}

// Role assignment types (for Prompt 3)
export type RoleName = 
  | "nawab_siraj"
  | "lutfunnesa"
  | "mir_madan"
  | "mohon_lal"
  | "saint_frasy"
  | "de_bussy"
  | "mir_jafar"
  | "umichad"
  | "jean_law"
  | "ghasheti_begum"
  | "yar_lutuf"
  | "tara_bai"
  | "rai_durlabh"
  | "jagat_seth";

export type TeamName = "green" | "red" | "gold";

export interface IRoleAssignment {
  userId: string;
  role: RoleName;
  team: TeamName;
}

export interface IPrivateRoleInfo {
  role: RoleName;
  team: TeamName;
  visiblePlayers: Array<{ userId: string; role: string; team: TeamName }>;
  isFlustered: boolean;
  deBussyUsed: boolean;
}

export interface GameStartPayload {
  roomId: string;
  hostUserId: string;
}