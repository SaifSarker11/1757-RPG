import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

function adminIds(): Set<string> {
  return new Set(
    (process.env.ADMIN_USER_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean)
  );
}
import { db } from "@repo/db";
import { createRequireUser, currentUser, type SessionResolver } from "../lib/session.js";
import {
  getTelemetryOverview,
  listAdminActiveRooms,
  listAdminMatches,
  listAdminUsers,
} from "./queries.js";
import { adminPaginationSchema, userModerationSchema } from "./schemas.js";

export interface AdminRouteDeps {
  resolveSession: SessionResolver;
}

export async function registerAdminRoutes(app: FastifyInstance, deps: AdminRouteDeps) {
  const requireSignedIn = createRequireUser(deps.resolveSession);
  // Admin access is an explicit allowlist of user IDs (ADMIN_USER_IDS, comma separated).
  // Being signed in is NOT enough: guests and regular players get 403.
  const requireUser = async (request: FastifyRequest, reply: FastifyReply) => {
    await requireSignedIn.call(app, request, reply);
    if (reply.sent) return;
    const user = request.sessionUser;
    if (!user || user.isAnonymous || !adminIds().has(user.id)) {
      return reply.status(403).send({ error: "Forbidden", code: "FORBIDDEN", success: false });
    }
  };

  // GET /api/admin/overview - Overall game & system telemetry
  app.get("/api/admin/overview", { preHandler: requireUser }, async (request, reply) => {
    currentUser(request); // Verifies authenticated session
    const overview = await getTelemetryOverview(db);
    return { data: overview, success: true };
  });

  // GET /api/admin/matches - Paginated matches with filter & search
  app.get("/api/admin/matches", { preHandler: requireUser }, async (request, reply) => {
    currentUser(request);
    const query = adminPaginationSchema.parse(request.query);
    const result = await listAdminMatches(db, query);
    return { data: result, success: true };
  });

  // GET /api/admin/users - User directory with moderation lookup
  app.get("/api/admin/users", { preHandler: requireUser }, async (request, reply) => {
    currentUser(request);
    const query = adminPaginationSchema.parse(request.query);
    const result = await listAdminUsers(db, query);
    return { data: result, success: true };
  });

  // GET /api/admin/rooms/active - Live lobbies & matches in progress
  app.get("/api/admin/rooms/active", { preHandler: requireUser }, async (request, reply) => {
    currentUser(request);
    const rooms = await listAdminActiveRooms(db);
    return { data: rooms, success: true };
  });

  // PATCH /api/admin/users/:userId - Moderate user (e.g. rename or update)
  app.patch("/api/admin/users/:userId", { preHandler: requireUser }, async (request, reply) => {
    currentUser(request);
    const { userId } = request.params as { userId: string };
    const parsed = userModerationSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: parsed.error.issues[0]?.message ?? "Invalid moderation input",
        success: false,
      });
    }

    const { name } = parsed.data;

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return reply.status(404).send({ error: "User not found", success: false });
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        level: true,
      },
    });

    return { data: updated, success: true };
  });
}
