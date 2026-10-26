import type { FastifyInstance, FastifyReply } from "fastify";
import { db, type PlayerRole } from "@repo/db";
import { createRequireUser, currentUser, type SessionResolver } from "../lib/session.js";
import type { LobbyNotifier } from "../lobby/notifier.js";
import { generateUniqueRoomCode, normalizeRoomCode } from "../lobby/roomCode.js";
import {
  isRoomCodeTaken,
  listPublicRooms,
  listQuickJoinCandidates,
  loadRoomRow,
} from "../lobby/roomQueries.js";
import {
  LOBBY_ERRORS,
  joinError,
  kickError,
  leaveError,
  pickNewHost,
  pickQuickJoin,
  settingsError,
  type LobbyError,
} from "../lobby/rules.js";
import {
  DEFAULT_ROOM_SETTINGS,
  codeParams,
  createRoomBody,
  kickBody,
  parse,
  roomIdParams,
  updateSettingsBody,
} from "../lobby/schemas.js";
import { toRoomDetail } from "../lobby/views.js";

export interface RoomRouteDeps {
  resolveSession: SessionResolver;
  notifier: LobbyNotifier;
}

function sendLobbyError(reply: FastifyReply, code: LobbyError) {
  const { status, message } = LOBBY_ERRORS[code];
  return reply.status(status).send({ error: message, code, success: false });
}

function sendInvalid(reply: FastifyReply, message: string) {
  return reply.status(400).send({ error: message, code: "INVALID_INPUT", success: false });
}

function generateId(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Room and lobby routes (M5). Every write takes the caller from the session;
 * user ids in request bodies are ignored.
 */
export async function registerRoomRoutes(app: FastifyInstance, deps: RoomRouteDeps) {
  const requireUser = createRequireUser(deps.resolveSession);
  const { notifier } = deps;

  type JoinResult = { ok: true; playerCount: number } | { ok: false; error: LobbyError };

  /** Checks and inserts in one transaction so two joins can't both take the last seat. */
  async function joinRoom(roomId: string, userId: string): Promise<JoinResult> {
    return db.$transaction(async (tx): Promise<JoinResult> => {
      const room = await tx.room.findUnique({
        where: { id: roomId },
        include: { players: { select: { userId: true, createdAt: true } } },
      });
      if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };
      const error = joinError(room, userId);
      if (error) return { ok: false, error };
      await tx.roomPlayer.create({ data: { roomId, userId } });
      return { ok: true, playerCount: room.players.length + 1 };
    });
  }

  // --- Lobby -----------------------------------------------------------------

  app.get("/rooms", async () => ({ rooms: await listPublicRooms() }));

  app.post("/rooms", { preHandler: requireUser }, async (request, reply) => {
    const body = parse(createRoomBody, request.body);
    if (!body.ok) return sendInvalid(reply, body.message);

    const user = currentUser(request);
    const settings = { ...DEFAULT_ROOM_SETTINGS, ...body.data };
    const code = await generateUniqueRoomCode(isRoomCodeTaken);

    const room = await db.room.create({
      data: {
        code,
        hostUserId: user.id,
        status: "WAITING",
        currentRound: 0,
        maxPlayers: settings.maxPlayers,
        discussionSeconds: settings.discussionSeconds,
        enabledRoles: settings.enabledRoles as PlayerRole[],
        isPublic: settings.isPublic,
        players: { create: { userId: user.id } },
      },
    });

    notifier.lobbyChanged();
    return reply.status(201).send({
      roomId: room.id,
      code: room.code,
      status: room.status,
      maxPlayers: room.maxPlayers,
      hostUserId: room.hostUserId,
    });
  });

  app.post("/rooms/quick-join", { preHandler: requireUser }, async (request, reply) => {
    const user = currentUser(request);
    const target = pickQuickJoin(await listQuickJoinCandidates(), user.id);
    if (!target) return sendLobbyError(reply, "NO_OPEN_ROOM");

    const result = await joinRoom(target.id, user.id);
    if (!result.ok) return sendLobbyError(reply, result.error);

    notifier.roomChanged(target.id);
    notifier.lobbyChanged();
    return { roomId: target.id, userId: user.id, playerCount: result.playerCount };
  });

  app.get("/rooms/code/:code", async (request, reply) => {
    const params = parse(codeParams, request.params);
    const code = params.ok ? normalizeRoomCode(params.data.code) : null;
    if (!code) return sendInvalid(reply, "Room codes are 6 letters or digits");

    const room = await db.room.findUnique({ where: { code }, select: { id: true, code: true } });
    if (!room) return sendLobbyError(reply, "ROOM_NOT_FOUND");
    return { roomId: room.id, code: room.code };
  });

  // --- One room ----------------------------------------------------------------

  app.get("/rooms/:roomId", async (request, reply) => {
    const params = parse(roomIdParams, request.params);
    if (!params.ok) return sendInvalid(reply, params.message);
    const room = await loadRoomRow(params.data.roomId);
    if (!room) return sendLobbyError(reply, "ROOM_NOT_FOUND");
    return toRoomDetail(room);
  });

  app.post("/rooms/:roomId/join", { preHandler: requireUser }, async (request, reply) => {
    const params = parse(roomIdParams, request.params);
    if (!params.ok) return sendInvalid(reply, params.message);

    const user = currentUser(request);
    const result = await joinRoom(params.data.roomId, user.id);
    if (!result.ok) return sendLobbyError(reply, result.error);

    notifier.roomChanged(params.data.roomId);
    notifier.lobbyChanged();
    return { roomId: params.data.roomId, userId: user.id, playerCount: result.playerCount };
  });

  app.post("/rooms/:roomId/leave", { preHandler: requireUser }, async (request, reply) => {
    const params = parse(roomIdParams, request.params);
    if (!params.ok) return sendInvalid(reply, params.message);

    const user = currentUser(request);
    const { roomId } = params.data;
    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { players: { select: { userId: true, createdAt: true } } },
    });
    if (!room) return sendLobbyError(reply, "ROOM_NOT_FOUND");
    const error = leaveError(room, user.id);
    if (error) return sendLobbyError(reply, error);

    const newHostUserId = room.hostUserId === user.id ? pickNewHost(room, user.id) : null;
    const emptied = room.players.length === 1;

    await db.$transaction(async (tx) => {
      if (emptied) {
        await tx.room.delete({ where: { id: roomId } });
        return;
      }
      await tx.roomPlayer.delete({ where: { roomId_userId: { roomId, userId: user.id } } });
      if (newHostUserId) {
        await tx.room.update({ where: { id: roomId }, data: { hostUserId: newHostUserId } });
      }
    });

    if (!emptied) notifier.roomChanged(roomId);
    notifier.lobbyChanged();
    return { roomId, userId: user.id, newHostUserId };
  });

  app.patch("/rooms/:roomId/settings", { preHandler: requireUser }, async (request, reply) => {
    const params = parse(roomIdParams, request.params);
    if (!params.ok) return sendInvalid(reply, params.message);
    const body = parse(updateSettingsBody, request.body);
    if (!body.ok) return sendInvalid(reply, body.message);

    const user = currentUser(request);
    const { roomId } = params.data;
    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { players: { select: { userId: true, createdAt: true } } },
    });
    if (!room) return sendLobbyError(reply, "ROOM_NOT_FOUND");
    const error = settingsError(room, user.id, body.data);
    if (error) return sendLobbyError(reply, error);

    const { enabledRoles, ...rest } = body.data;
    await db.room.update({
      where: { id: roomId },
      data: { ...rest, ...(enabledRoles ? { enabledRoles: enabledRoles as PlayerRole[] } : {}) },
    });

    notifier.roomChanged(roomId);
    notifier.lobbyChanged();
    const updated = await loadRoomRow(roomId);
    return updated ? toRoomDetail(updated) : sendLobbyError(reply, "ROOM_NOT_FOUND");
  });

  app.post("/rooms/:roomId/kick", { preHandler: requireUser }, async (request, reply) => {
    const params = parse(roomIdParams, request.params);
    if (!params.ok) return sendInvalid(reply, params.message);
    const body = parse(kickBody, request.body);
    if (!body.ok) return sendInvalid(reply, body.message);

    const user = currentUser(request);
    const { roomId } = params.data;
    const targetId = body.data.userId;
    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { players: { select: { userId: true, createdAt: true } } },
    });
    if (!room) return sendLobbyError(reply, "ROOM_NOT_FOUND");
    const error = kickError(room, user.id, targetId);
    if (error) return sendLobbyError(reply, error);

    await db.$transaction([
      db.roomPlayer.delete({ where: { roomId_userId: { roomId, userId: targetId } } }),
      db.room.update({ where: { id: roomId }, data: { bannedUserIds: { push: targetId } } }),
    ]);

    notifier.playerKicked(roomId, targetId);
    notifier.roomChanged(roomId);
    notifier.lobbyChanged();
    return { roomId, userId: targetId };
  });

  // Game start lives in the realtime layer (socket `game:start`); the old
  // REST start path that skipped Redis setup was removed.

  // --- Owned by the auth module (M8); unchanged here ---------------------------

  if (process.env.NODE_ENV !== "production") {
    app.post("/rooms/dev/create-user", async (request, reply) => {
      const { name } = request.body as { name?: string };
      const id = generateId();
      const email = `${id}@test.local`;
      const user = await db.user.create({
        data: { id, name: name || "Test User", email },
      });
      return reply.send({ data: { userId: user.id, token: id }, success: true });
    });
  }

  app.post("/users/update-profile", async (request, reply) => {
    const { userId, name } = request.body as { userId: string; name: string };
    if (!userId || !name) {
      return reply.status(400).send({ error: "userId and name required", success: false });
    }
    await db.user.update({
      where: { id: userId },
      data: { name },
    });
    return { success: true };
  });
}
