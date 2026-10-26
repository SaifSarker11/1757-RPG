import { fromNodeHeaders } from "better-auth/node";
import { auth } from "@repo/auth";
import type { SessionResolver } from "./session.js";

/** Resolves the BetterAuth session (cookie or bearer token). */
export const resolveAuthSession: SessionResolver = async (headers) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(headers) });
  if (!session) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    isAnonymous: session.user.isAnonymous === true,
  };
};
