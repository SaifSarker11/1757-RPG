import type { FastifyReply, FastifyRequest, preHandlerAsyncHookHandler } from "fastify";
import type { IncomingHttpHeaders } from "node:http";

export interface SessionUser {
  id: string;
  name: string;
  isAnonymous: boolean;
}

/** Looks up the signed-in user from request headers (cookie or bearer token). */
export type SessionResolver = (headers: IncomingHttpHeaders) => Promise<SessionUser | null>;

declare module "fastify" {
  interface FastifyRequest {
    /** Set by `requireUser`. The only trusted source of the caller's identity. */
    sessionUser?: SessionUser;
  }
}

/**
 * Builds a preHandler that rejects unauthenticated requests with 401 and
 * otherwise sets `request.sessionUser`. Routes must use it instead of any
 * user id sent in the body.
 */
export function createRequireUser(resolve: SessionResolver): preHandlerAsyncHookHandler {
  return async function requireUser(request: FastifyRequest, reply: FastifyReply) {
    const user = await resolve(request.headers);
    if (!user) {
      return reply.status(401).send({ error: "Unauthorized", code: "UNAUTHORIZED", success: false });
    }
    request.sessionUser = user;
  };
}

/** For handlers behind `requireUser`. Throws if the hook was not applied. */
export function currentUser(request: FastifyRequest): SessionUser {
  if (!request.sessionUser) throw new Error("requireUser preHandler missing on this route");
  return request.sessionUser;
}
