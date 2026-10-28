import Fastify from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionUser } from "../lib/session.js";

// No database in unit tests: every db call fails loudly unless a test stubs it.
const db = vi.hoisted(() => ({
  room: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  roomPlayer: { create: vi.fn(), delete: vi.fn() },
  user: { create: vi.fn(), update: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock("@repo/db", () => ({ db }));

const { registerRoomRoutes } = await import("./rooms.js");

const host: SessionUser = { id: "host", name: "Host", isAnonymous: false };

async function buildApp(user: SessionUser | null = host) {
  const app = Fastify();
  const notifier = { lobbyChanged: vi.fn(), roomChanged: vi.fn(), playerKicked: vi.fn() };
  await registerRoomRoutes(app, { resolveSession: async () => user, notifier });
  return { app, notifier };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("authentication", () => {
  const writes: Array<[string, string]> = [
    ["POST", "/rooms"],
    ["POST", "/rooms/quick-join"],
    ["POST", "/rooms/r1/join"],
    ["POST", "/rooms/r1/leave"],
    ["PATCH", "/rooms/r1/settings"],
    ["POST", "/rooms/r1/kick"],
  ];

  for (const [method, url] of writes) {
    it(`${method} ${url} needs a session`, async () => {
      const { app } = await buildApp(null);
      const res = await app.inject({ method: method as "POST", url, payload: { userId: "spoof" } });
      expect(res.statusCode).toBe(401);
      expect(db.room.findUnique).not.toHaveBeenCalled();
    });
  }

  it("the removed REST start route is gone", async () => {
    const { app } = await buildApp();
    const res = await app.inject({ method: "POST", url: "/rooms/r1/start", payload: {} });
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /rooms", () => {
  it("creates the room for the session user, not a body hostUserId", async () => {
    db.room.findUnique.mockResolvedValue(null); // code is free
    db.room.create.mockImplementation(async ({ data }) => ({ id: "new-room", ...data }));
    const { app, notifier } = await buildApp();

    const res = await app.inject({
      method: "POST",
      url: "/rooms",
      payload: { hostUserId: "spoofed", maxPlayers: 8, discussionSeconds: 60 },
    });

    expect(res.statusCode).toBe(201);
    const data = db.room.create.mock.calls[0]?.[0].data;
    expect(data).toMatchObject({
      hostUserId: "host",
      maxPlayers: 8,
      discussionSeconds: 60,
      isPublic: true,
      players: { create: { userId: "host" } },
    });
    expect(data.code).toMatch(/^[A-Z0-9]{6}$/);
    expect(res.json()).toMatchObject({ roomId: "new-room", hostUserId: "host" });
    expect(notifier.lobbyChanged).toHaveBeenCalledOnce();
  });

  it("rejects invalid settings with 400", async () => {
    const { app } = await buildApp();
    const res = await app.inject({ method: "POST", url: "/rooms", payload: { maxPlayers: 20 } });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ code: "INVALID_INPUT" });
    expect(db.room.create).not.toHaveBeenCalled();
  });
});

describe("GET /rooms/code/:code", () => {
  it("rejects malformed codes without a lookup", async () => {
    const { app } = await buildApp();
    const res = await app.inject({ method: "GET", url: "/rooms/code/clx9abc" });
    expect(res.statusCode).toBe(400);
    expect(db.room.findUnique).not.toHaveBeenCalled();
  });

  it("looks up the exact upper-cased code only", async () => {
    db.room.findUnique.mockResolvedValue({ id: "r1", code: "AB12CD" });
    const { app } = await buildApp();
    const res = await app.inject({ method: "GET", url: "/rooms/code/ab12cd" });
    expect(res.json()).toEqual({ roomId: "r1", code: "AB12CD" });
    expect(db.room.findUnique.mock.calls[0]?.[0]).toMatchObject({ where: { code: "AB12CD" } });
  });

  it("404s for unknown codes", async () => {
    db.room.findUnique.mockResolvedValue(null);
    const { app } = await buildApp();
    const res = await app.inject({ method: "GET", url: "/rooms/code/ZZZZZZ" });
    expect(res.statusCode).toBe(404);
  });
});

describe("lobby rule errors reach the client", () => {
  const lobbyRoom = (overrides = {}) => ({
    id: "r1",
    hostUserId: "host",
    status: "WAITING",
    maxPlayers: 6,
    isPublic: true,
    bannedUserIds: [],
    createdAt: new Date(),
    players: [{ userId: "host", createdAt: new Date() }],
    ...overrides,
  });

  it("a non-host can't kick", async () => {
    db.room.findUnique.mockResolvedValue(lobbyRoom({ hostUserId: "someone-else" }));
    const { app } = await buildApp();
    const res = await app.inject({ method: "POST", url: "/rooms/r1/kick", payload: { userId: "x" } });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toMatchObject({ code: "NOT_HOST" });
  });

  it("leaving mid-game is refused", async () => {
    db.room.findUnique.mockResolvedValue(lobbyRoom({ status: "IN_PROGRESS" }));
    const { app } = await buildApp();
    const res = await app.inject({ method: "POST", url: "/rooms/r1/leave" });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toMatchObject({ code: "GAME_IN_PROGRESS" });
  });

  it("joining twice keeps the message the web client matches on", async () => {
    db.$transaction.mockImplementation(async (fn: (tx: typeof db) => unknown) => fn(db));
    db.room.findUnique.mockResolvedValue(lobbyRoom());
    const { app } = await buildApp();
    const res = await app.inject({ method: "POST", url: "/rooms/r1/join" });
    expect(res.json()).toMatchObject({ error: "User already in room", code: "ALREADY_IN_ROOM" });
  });

  it("Quick Join with nothing open is a 404", async () => {
    db.room.findMany.mockResolvedValue([]);
    const { app } = await buildApp();
    const res = await app.inject({ method: "POST", url: "/rooms/quick-join" });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({ code: "NO_OPEN_ROOM" });
  });
});
