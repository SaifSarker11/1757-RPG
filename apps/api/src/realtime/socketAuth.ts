import type { Socket } from "socket.io";
import type { SessionResolver, SessionUser } from "../lib/session.js";

interface AuthedSocketData {
  user?: SessionUser | null;
}

/** The session user for this socket, or null for an anonymous connection. */
export function socketUser(socket: Pick<Socket, "data">): SessionUser | null {
  return (socket.data as AuthedSocketData).user ?? null;
}

export function userChannel(userId: string): string {
  return `user:${userId}`;
}

/**
 * Socket.IO middleware. Resolves the BetterAuth session from the handshake
 * cookie, or from `auth: { token }` sent as a bearer token (mobile).
 *
 * Connections without a session are still accepted so the mobile global
 * chat keeps working, but every room and game event refuses them.
 * Signed-in sockets join their private `user:<id>` channel.
 */
export function createSocketAuth(resolve: SessionResolver) {
  return async (socket: Socket, next: (err?: Error) => void): Promise<void> => {
    try {
      const headers = { ...socket.handshake.headers };
      const auth: unknown = socket.handshake.auth;
      const token =
        typeof auth === "object" && auth !== null && "token" in auth ? auth.token : undefined;
      if (typeof token === "string" && token.length > 0 && !headers.authorization) {
        headers.authorization = `Bearer ${token}`;
      }

      const user = await resolve(headers);
      (socket.data as AuthedSocketData).user = user;
      if (user) await socket.join(userChannel(user.id));
      next();
    } catch {
      next(new Error("AUTH_FAILED"));
    }
  };
}
