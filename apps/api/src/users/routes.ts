import type { FastifyInstance, FastifyReply } from "fastify";
import { db } from "@repo/db";
import { createRequireUser, currentUser, type SessionResolver } from "../lib/session.js";
import { getMatchHistory, getUserProfile, getUserStats } from "./queries.js";
import { statsQuerySchema, updateProfileSchema } from "./schemas.js";

export interface UserRouteDeps {
  resolveSession: SessionResolver;
}

export async function registerUserRoutes(app: FastifyInstance, deps: UserRouteDeps) {
  const requireUser = createRequireUser(deps.resolveSession);

  // GET /api/users/me - Current user's complete profile
  app.get("/api/users/me", { preHandler: requireUser }, async (request, reply) => {
    const user = currentUser(request);
    const profile = await getUserProfile(db, user.id);
    if (!profile) {
      return reply.status(404).send({ error: "User not found", success: false });
    }
    return { data: profile, success: true };
  });

  // PATCH /api/users/me - Update profile fields (name, username, avatarId)
  app.patch("/api/users/me", { preHandler: requireUser }, async (request, reply) => {
    const user = currentUser(request);
    const parsed = updateProfileSchema.safeParse(request.body);

    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid input";
      return reply.status(400).send({ error: msg, code: "INVALID_INPUT", success: false });
    }

    const { name, username, avatarId } = parsed.data;

    // Check username uniqueness if provided
    if (username) {
      const existing = await db.user.findUnique({
        where: { username },
        select: { id: true },
      });
      if (existing && existing.id !== user.id) {
        return reply.status(409).send({
          error: "Username is already taken",
          code: "USERNAME_TAKEN",
          success: false,
        });
      }
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(username !== undefined && { username }),
        ...(avatarId !== undefined && { avatarId }),
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatarId: true,
        xp: true,
        level: true,
      },
    });

    return { data: updated, success: true };
  });

  // Backward compatibility: POST /users/update-profile
  app.post("/users/update-profile", { preHandler: requireUser }, async (request, reply) => {
    const user = currentUser(request);
    const body = request.body as { name?: string; userId?: string };
    const name = body?.name?.trim();

    if (!name) {
      return reply.status(400).send({ error: "name required", success: false });
    }

    await db.user.update({
      where: { id: user.id },
      data: { name },
    });

    return { success: true };
  });

  // GET /api/users/me/stats - Career stats (matches, win rate, forfeits, humiliations)
  app.get("/api/users/me/stats", { preHandler: requireUser }, async (request, reply) => {
    const user = currentUser(request);
    const stats = await getUserStats(db, user.id);
    if (!stats) {
      return reply.status(404).send({ error: "User not found", success: false });
    }
    return { data: stats, success: true };
  });

  // GET /api/users/me/history - Paginated match history
  app.get("/api/users/me/history", { preHandler: requireUser }, async (request, reply) => {
    const user = currentUser(request);
    const query = statsQuerySchema.parse(request.query);
    const history = await getMatchHistory(db, user.id, query);
    return { data: history, success: true };
  });

  // GET /api/users/:userId/stats - Public player profile/stats by userId
  app.get("/api/users/:userId/stats", async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const stats = await getUserStats(db, userId);
    if (!stats) {
      return reply.status(404).send({ error: "User not found", success: false });
    }
    return { data: stats, success: true };
  });
}
