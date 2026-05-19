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
}; 