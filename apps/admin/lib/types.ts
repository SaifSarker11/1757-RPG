export interface TelemetryOverview {
  totalUsers: number;
  registeredUsers: number;
  anonymousUsers: number;
  totalRooms: number;
  activeRooms: number;
  finishedMatches: number;
  greenWins: number;
  redWins: number;
  goldWins: number;
  winRateGreen: number;
  winRateRed: number;
  averagePlayerCount: number;
}

export interface MatchSummaryRow {
  id: string;
  roomCode: string;
  playerCount: number;
  startedAt: string;
  endedAt: string;
  winner: "GREEN" | "RED" | "GOLD";
  reason: string;
  roundsGreen: number;
  roundsRed: number;
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  username: string | null;
  avatarId: string | null;
  xp: number;
  level: number;
  isAnonymous: boolean;
  createdAt: string;
}

export interface ActiveRoomRow {
  id: string;
  code: string;
  status: "WAITING" | "IN_PROGRESS";
  maxPlayers: number;
  isPublic: boolean;
  discussionSeconds: number;
  currentRound: number;
  createdAt: string;
  players: Array<{
    id: string;
    userId: string;
    user?: { name: string; username: string | null } | null;
  }>;
}
