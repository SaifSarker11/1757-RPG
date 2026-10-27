import { createServer, type Server as HttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Server } from "socket.io";
import { io as connect, type Socket as ClientSocket } from "socket.io-client";
import type { PlayerView } from "@repo/game-engine";
import type { SessionUser } from "../lib/session.js";
import { GameService } from "../realtime/gameService.js";
import { createLobbyCleanup } from "../realtime/lobbyCleanup.js";
import type { GameRoomRepository } from "../realtime/roomRepository.js";
import { createTimerScheduler } from "../realtime/scheduler.js";
import { MemorySnapshotStore } from "../realtime/snapshotStore.js";
import { createSocketTransport } from "../realtime/transport.js";
import { registerSocketHandlers } from "./index.js";

const USERS = ["u1", "u2", "u3", "u4", "u5", "u6"];

type AckResult = { ok: true } | { ok: false; error: { code: string; message: string } };

let http: HttpServer;
let io: Server;
let url: string;
let games: GameService;
let clients: ClientSocket[] = [];

const repo: GameRoomRepository = {
  loadForStart: async (roomId) => ({
    id: roomId,
    code: "AB12CD",
    hostUserId: "u1",
    status: "WAITING",
    discussionSeconds: 30,
    enabledRoles: [],
    mode: "STANDARD",
    roundDiscussionSeconds: [],
    roleAssignments: {},
    players: USERS.map((userId, i) => ({ userId, createdAt: new Date(i), isAnonymous: false })),
  }),
  isMember: async (_roomId, userId) => USERS.includes(userId),
  claimForStart: async () => true,
  markFinished: async () => {},
  saveMatch: async () => ({ id: "m1" }),
  deleteIfWaiting: async () => false,
};

/** Test sessions: the bearer token is the user id. */
async function resolveSession(headers: Record<string, unknown>): Promise<SessionUser | null> {
  const auth = headers.authorization;
  if (typeof auth !== "string" || !auth.startsWith("Bearer ")) return null;
  const id = auth.slice("Bearer ".length);
  return USERS.includes(id) || id === "outsider" ? { id, name: id, isAnonymous: false } : null;
}

beforeEach(async () => {
  http = createServer();
  io = new Server(http);
  const scheduler = createTimerScheduler();
  games = new GameService({
    store: new MemorySnapshotStore(),
    scheduler,
    repo,
    transport: createSocketTransport(io),
  });
  registerSocketHandlers(io, {
    resolveSession,
    games,
    repo,
    cleanup: createLobbyCleanup({
      scheduler,
      connectedCount: async () => 1,
      deleteIfWaiting: async () => false,
      onDeleted: () => {},
    }),
  });
  await new Promise<void>((resolve) => http.listen(0, resolve));
  url = `http://localhost:${(http.address() as AddressInfo).port}`;
});

afterEach(async () => {
  for (const c of clients) c.disconnect();
  clients = [];
  games.stop();
  await new Promise<void>((resolve) => io.close(() => resolve()));
});

async function client(token?: string): Promise<ClientSocket> {
  const socket = connect(url, { auth: token ? { token } : {}, transports: ["websocket"], forceNew: true });
  clients.push(socket);
  await new Promise<void>((resolve, reject) => {
    socket.once("connect", () => resolve());
    socket.once("connect_error", reject);
  });
  return socket;
}

const send = (socket: ClientSocket, event: string, payload: unknown) =>
  socket.timeout(5_000).emitWithAck(event, payload) as Promise<AckResult>;

/** Connects all six players and joins them to the room channel. */
async function seatEveryone() {
  const sockets = await Promise.all(USERS.map((id) => client(id)));
  const views = new Map<string, PlayerView[]>();
  sockets.forEach((s, i) => {
    const id = USERS[i] as string;
    views.set(id, []);
    s.on("game:view", ({ view }: { view: PlayerView }) => views.get(id)?.push(view));
  });
  for (const s of sockets) expect(await send(s, "room:join", { roomId: "room-1" })).toEqual({ ok: true });
  return { sockets, views };
}

const until = async (check: () => boolean) => {
  for (let i = 0; i < 100 && !check(); i++) await new Promise((r) => setTimeout(r, 20));
  expect(check()).toBe(true);
};

describe("socket auth", () => {
  it("lets anonymous sockets connect but refuses their room and game events", async () => {
    const anon = await client();
    expect(await send(anon, "game:start", { roomId: "room-1" })).toMatchObject({
      ok: false,
      error: { code: "UNAUTHORIZED" },
    });
    expect(await send(anon, "room:join", { roomId: "room-1" })).toMatchObject({ error: { code: "UNAUTHORIZED" } });
  });

  it("refuses room:join for someone who isn't in the room", async () => {
    const outsider = await client("outsider");
    expect(await send(outsider, "room:join", { roomId: "room-1" })).toMatchObject({
      error: { code: "NOT_IN_ROOM" },
    });
  });
});

describe("validation and errors", () => {
  it("rejects malformed payloads", async () => {
    const u1 = await client("u1");
    expect(await send(u1, "game:action", { roomId: "room-1", action: { type: "TICK" } })).toMatchObject({
      error: { code: "INVALID_PAYLOAD" },
    });
  });

  it("sends game:error to the sender only", async () => {
    const { sockets } = await seatEveryone();
    const [u1, u2] = sockets as [ClientSocket, ClientSocket];
    const u1Errors = vi.fn();
    const u2Errors = vi.fn();
    u1.on("game:error", u1Errors);
    u2.on("game:error", u2Errors);

    expect(await send(u2, "game:start", { roomId: "room-1" })).toMatchObject({ error: { code: "NOT_HOST" } });
    await until(() => u2Errors.mock.calls.length === 1);
    expect(u1Errors).not.toHaveBeenCalled();
  });

  it("rate-limits game actions per socket", async () => {
    const u1 = await client("u1");
    const results = await Promise.all(
      Array.from({ length: 15 }, () => send(u1, "game:sync", { roomId: "room-1" }))
    );
    const limited = results.filter((r) => !r.ok && r.error.code === "RATE_LIMITED");
    expect(limited.length).toBeGreaterThanOrEqual(5);
  });
});

describe("game over sockets", () => {
  it("starts a game and gives every player only their own view", async () => {
    const { sockets, views } = await seatEveryone();
    const started = vi.fn();
    sockets[3]?.on("game:started", started);

    expect(await send(sockets[0] as ClientSocket, "game:start", { roomId: "room-1" })).toEqual({ ok: true });

    await until(() => USERS.every((id) => (views.get(id)?.length ?? 0) > 0));
    for (const id of USERS) {
      for (const view of views.get(id) ?? []) {
        expect(view.me.id).toBe(id);
        expect(view.game.players.every((p) => p.role === undefined)).toBe(true);
      }
    }
    await until(() => started.mock.calls.length === 1);
  });

  it("ignores a playerId smuggled into an action", async () => {
    const { sockets } = await seatEveryone();
    await send(sockets[0] as ClientSocket, "game:start", { roomId: "room-1" });
    const u3Errors = vi.fn();
    sockets[2]?.on("game:error", u3Errors);

    // u2 tries to vote as u3 during ROLE_REVEAL: rejected for u2, nothing for u3.
    const result = await send(sockets[1] as ClientSocket, "game:action", {
      roomId: "room-1",
      action: { type: "CAST_VOTE", vote: "APPROVE", playerId: "u3" },
    });
    expect(result).toMatchObject({ ok: false, error: { code: "WRONG_PHASE" } });
    await new Promise((r) => setTimeout(r, 50));
    expect(u3Errors).not.toHaveBeenCalled();
  });

  it("game:sync re-sends the caller's view", async () => {
    const { sockets, views } = await seatEveryone();
    await send(sockets[0] as ClientSocket, "game:start", { roomId: "room-1" });
    await until(() => (views.get("u4")?.length ?? 0) === 1);
    expect(await send(sockets[3] as ClientSocket, "game:sync", { roomId: "room-1" })).toEqual({ ok: true });
    await until(() => (views.get("u4")?.length ?? 0) === 2);
    expect(views.get("u5")).toHaveLength(1);
  });
});

describe("M7 reconnect & disconnect", () => {
  it("emits player:status false when a player disconnects", async () => {
    const { sockets } = await seatEveryone();
    const statusEvents: unknown[] = [];
    sockets[1]?.on("player:status", (e) => statusEvents.push(e));

    // u1 disconnects.
    sockets[0]?.disconnect();
    await until(() => statusEvents.some((e) => (e as { online: boolean }).online === false));
    expect(statusEvents).toContainEqual({ userId: "u1", online: false });
  });

  it("emits player:status true when a player reconnects (room:join)", async () => {
    const { sockets } = await seatEveryone();
    const statusEvents: unknown[] = [];
    sockets[1]?.on("player:status", (e) => statusEvents.push(e));

    sockets[0]?.disconnect();
    await until(() => statusEvents.some((e) => (e as { online: boolean }).online === false));

    // u1 reconnects with a fresh socket.
    const reconnected = await client("u1");
    clients.push(reconnected);
    await send(reconnected, "room:join", { roomId: "room-1" });

    await until(() => statusEvents.some((e) => (e as { online: boolean }).online === true));
    expect(statusEvents).toContainEqual({ userId: "u1", online: true });
  });

  it("game:sync on reconnect re-sends the player's view", async () => {
    const { sockets, views } = await seatEveryone();
    await send(sockets[0] as ClientSocket, "game:start", { roomId: "room-1" });
    await until(() => (views.get("u2")?.length ?? 0) >= 1);

    const before = views.get("u2")?.length ?? 0;

    // u2 disconnects and reconnects.
    sockets[1]?.disconnect();
    const reconnected = await client("u2");
    clients.push(reconnected);
    const newViews: unknown[] = [];
    reconnected.on("game:view", (v) => newViews.push(v));

    await send(reconnected, "room:join", { roomId: "room-1" });
    await until(() => newViews.length > 0);

    // View was re-delivered to the reconnected socket.
    expect(newViews.length).toBeGreaterThanOrEqual(1);
    // Other players' view counts did not change.
    expect(views.get("u2")?.length).toBe(before); // old socket got nothing extra
  });
});
