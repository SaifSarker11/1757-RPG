import Fastify from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionUser } from "../lib/session.js";

const db = vi.hoisted(() => ({
  user: {
    count: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  room: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
  match: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
}));

vi.mock("@repo/db", () => ({ db }));

const { registerAdminRoutes } = await import("./routes.js");

const adminUser: SessionUser = { id: "admin-1", name: "Administrator", isAnonymous: false };

async function buildApp(user: SessionUser | null = adminUser) {
  const app = Fastify();
  await registerAdminRoutes(app, { resolveSession: async () => user });
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Admin Route Authentication", () => {
  it("rejects unauthenticated requests with 401", async () => {
    const app = await buildApp(null);
    const res = await app.inject({ method: "GET", url: "/api/admin/overview" });
    expect(res.statusCode).toBe(401);
  });
});

describe("GET /api/admin/overview", () => {
  it("computes accurate faction win rates and room totals", async () => {
    db.user.count
      .mockResolvedValueOnce(10) // totalUsers
      .mockResolvedValueOnce(3); // anonymousUsers
    db.room.count
      .mockResolvedValueOnce(5) // totalRooms
      .mockResolvedValueOnce(2); // activeRooms
    db.match.findMany.mockResolvedValueOnce([
      { winner: "GREEN", playerCount: 6 },
      { winner: "GREEN", playerCount: 8 },
      { winner: "RED", playerCount: 10 },
      { winner: "GOLD", playerCount: 6 },
    ]);

    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/api/admin/overview" });
    expect(res.statusCode).toBe(200);
    const json = res.json();
    expect(json.success).toBe(true);
    const data = json.data;
    expect(data.totalUsers).toBe(10);
    expect(data.registeredUsers).toBe(7);
    expect(data.anonymousUsers).toBe(3);
    expect(data.finishedMatches).toBe(4);
    expect(data.greenWins).toBe(2);
    expect(data.redWins).toBe(1);
    expect(data.goldWins).toBe(1);
    expect(data.winRateGreen).toBe(50); // 2 out of 4 = 50%
    expect(data.winRateRed).toBe(25); // 1 out of 4 = 25%
    expect(data.averagePlayerCount).toBe(7.5);
  });
});

describe("GET /api/admin/matches", () => {
  it("paginates match results", async () => {
    db.match.count.mockResolvedValueOnce(1);
    db.match.findMany.mockResolvedValueOnce([
      {
        id: "m-1",
        roomCode: "TEST01",
        playerCount: 6,
        startedAt: new Date(),
        endedAt: new Date(),
        winner: "GREEN",
        reason: "ROUNDS",
        roundsGreen: 3,
        roundsRed: 1,
      },
    ]);

    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/api/admin/matches?limit=10&offset=0" });
    expect(res.statusCode).toBe(200);
    const json = res.json();
    expect(json.data.total).toBe(1);
    expect(json.data.matches).toHaveLength(1);
    expect(json.data.matches[0].roomCode).toBe("TEST01");
  });
});

describe("PATCH /api/admin/users/:userId", () => {
  it("moderates user display name", async () => {
    db.user.findUnique.mockResolvedValueOnce({ id: "u-bad", name: "Inappropriate" });
    db.user.update.mockResolvedValueOnce({
      id: "u-bad",
      name: "Renamed Conspirator",
      username: "user_bad",
      email: "bad@example.com",
      level: 1,
    });

    const app = await buildApp();
    const res = await app.inject({
      method: "PATCH",
      url: "/api/admin/users/u-bad",
      payload: { name: "Renamed Conspirator" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.name).toBe("Renamed Conspirator");
  });
});
