import type { Server } from "socket.io";
import type { LobbyListing, RoomDetail } from "./views.js";

/**
 * Pushes lobby changes to clients so nobody has to poll (US_3, US_26).
 * Routes call these after a successful write.
 */
export interface LobbyNotifier {
  /** The public room list changed. */
  lobbyChanged(): void;
  /** A room's players, host or settings changed. */
  roomChanged(roomId: string): void;
  /** The host removed a player. */
  playerKicked(roomId: string, userId: string): void;
}

export const noopNotifier: LobbyNotifier = {
  lobbyChanged: () => {},
  roomChanged: () => {},
  playerKicked: () => {},
};

export interface NotifierSources {
  listPublicRooms(): Promise<LobbyListing[]>;
  loadRoom(roomId: string): Promise<RoomDetail | null>;
  onError(error: unknown): void;
}

/**
 * Socket.IO notifier. Events:
 * - `lobby:list` → room "lobby": LobbyListing[]
 * - `room:update` → the room's channel: RoomDetail (the shape the web client already reads)
 * - `room:settings` → the room's channel: the settings part of RoomDetail
 * - `room:kicked` → `user:<id>`: { roomId }; also `room:player-kicked` → the room: { userId }
 */
export function createSocketNotifier(io: Server, sources: NotifierSources): LobbyNotifier {
  const run = (task: () => Promise<void>) => {
    task().catch(sources.onError);
  };

  return {
    lobbyChanged() {
      run(async () => {
        io.to("lobby").emit("lobby:list", await sources.listPublicRooms());
      });
    },
    roomChanged(roomId) {
      run(async () => {
        const room = await sources.loadRoom(roomId);
        if (!room) return;
        io.to(roomId).emit("room:update", room);
        io.to(roomId).emit("room:settings", {
          maxPlayers: room.maxPlayers,
          discussionSeconds: room.discussionSeconds,
          enabledRoles: room.enabledRoles,
          isPublic: room.isPublic,
          mode: room.mode,
          roundDiscussionSeconds: room.roundDiscussionSeconds,
        });
      });
    },
    playerKicked(roomId, userId) {
      io.to(`user:${userId}`).emit("room:kicked", { roomId });
      io.to(roomId).emit("room:player-kicked", { userId });
    },
  };
}
