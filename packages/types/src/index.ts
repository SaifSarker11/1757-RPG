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
  proposedTeam: string[];
  teamVotes?: Record<string, string>;
  missionVotes?: Record<string, string>;
  greenVoteCount: number;
  redVoteCount: number;
  winner?: "GREEN" | "RED" | "GOLD" | null;
  rejectionCount: number;
};

// Room status type
export type RoomStatus = "WAITING" | "IN_PROGRESS" | "FINISHED";

// IRoom interface
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