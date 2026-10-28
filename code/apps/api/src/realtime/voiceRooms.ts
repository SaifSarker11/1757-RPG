import { MAX_PLAYERS } from "@repo/game-engine";

/** One socket in a room's voice channel. Peers are sockets, so two tabs are two peers. */
export interface VoiceParticipant {
  socketId: string;
  userId: string;
  muted: boolean;
}

/**
 * Who is in each room's voice channel. Audio flows peer to peer (WebRTC
 * mesh); the server only tracks membership and relays signaling, so the
 * channel is capped to keep every client's connection count sane.
 */
export class VoiceRooms {
  private readonly rooms = new Map<string, Map<string, VoiceParticipant>>();

  constructor(private readonly capacity = MAX_PLAYERS) {}

  /** Adds the socket and returns everyone who was already there, or null when full. */
  join(roomId: string, socketId: string, userId: string): VoiceParticipant[] | null {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = new Map();
      this.rooms.set(roomId, room);
    }
    const others = [...room.values()].filter((p) => p.socketId !== socketId);
    if (!room.has(socketId) && room.size >= this.capacity) return null;
    room.set(socketId, { socketId, userId, muted: false });
    return others;
  }

  /** True if the socket was in the channel. */
  leave(roomId: string, socketId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room?.delete(socketId)) return false;
    if (room.size === 0) this.rooms.delete(roomId);
    return true;
  }

  setMuted(roomId: string, socketId: string, muted: boolean): boolean {
    const participant = this.rooms.get(roomId)?.get(socketId);
    if (!participant) return false;
    participant.muted = muted;
    return true;
  }

  has(roomId: string, socketId: string): boolean {
    return this.rooms.get(roomId)?.has(socketId) ?? false;
  }

  list(roomId: string): VoiceParticipant[] {
    return [...(this.rooms.get(roomId)?.values() ?? [])].map((p) => ({ ...p }));
  }
}
