import Fastify from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionUser } from "../lib/session.js";

const db = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  matchPlayer: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
}));

vi.mock("@repo/db", () => ({ db }));

const { registerUserRoutes } = await import("./routes.js");

const testUser: SessionUser = { id: "u123", name: "Siraj", isAnonymous: false };

async function buildApp(user: SessionUser | null = testUser) {
  const app = Fastify();
  await registerUserRoutes(app, { resolveSession: async () => user });
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/users/me", () => {
  it("rejects unauthenticated requests with 401", async () => {
    const app = await buildApp(null);
    const res = await app.inject({ method: "GET", url: "/api/users/me" });
    expect(res.statusCode).toBe(401);
  });

  it("returns user profile with calculated level", async () => {
    db.user.findUnique.mockResolvedValueOnce({
      id: "u123",
      name: "Siraj",
      email: "siraj@bengal.io",
      username: "siraj_nawab",
      avatarId: "avatar-1",
      xp: 250,
      level: 1,
      isAnonymous: false,
      createdAt: new Date(),
    });

    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/api/users/me" });
    expect(res.statusCode).toBe(200);
    const json = res.json();
    expect(json.success).toBe(true);
    expect(json.data.username).toBe("siraj_nawab");
    expect(json.data.level).toBe(2); // Level 2 reached at 200 XP
  });
});

describe("PATCH /api/users/me", () => {
  it("validates username format", async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: "PATCH",
      url: "/api/users/me",
      payload: { username: "no!" }, // contains invalid char
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe("INVALID_INPUT");
  });

  it("prevents duplicate usernames", async () => {
    db.user.findUnique.mockResolvedValueOnce({ id: "other_user" });

    const app = await buildApp();
    const res = await app.inject({
      method: "PATCH",
      url: "/api/users/me",
      payload: { username: "taken_name" },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe("USERNAME_TAKEN");
  });

  it("updates allowed profile fields", async () => {
    db.user.findUnique.mockResolvedValueOnce(null); // username check passed
    db.user.update.mockResolvedValueOnce({
      id: "u123",
      name: "Updated Name",
      username: "new_alias",
      avatarId: "av-2",
      xp: 0,
      level: 1,
    });

    const app = await buildApp();
    const res = await app.inject({
      method: "PATCH",
      url: "/api/users/me",
      payload: { name: "Updated Name", username: "new_alias", avatarId: "av-2" },
    });
    expect(res.statusCode).toBe(200);
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "u123" },
      data: { name: "Updated Name", username: "new_alias", avatarId: "av-2" },
      select: expect.any(Object),
    });
  });
});

describe("GET /api/users/me/stats", () => {
  it("returns win rate and match counters", async () => {
    db.user.findUnique.mockResolvedValueOnce({
      id: "u123",
      name: "Siraj",
      email: "siraj@bengal.io",
      username: "siraj_nawab",
      avatarId: null,
      xp: 500,
      level: 2,
      isAnonymous: false,
      createdAt: new Date(),
    });

    db.matchPlayer.findMany.mockResolvedValueOnce([
      { won: true, jeanLawLocked: false, disconnectedForfeit: false },
      { won: true, jeanLawLocked: true, disconnectedForfeit: false },
      { won: false, jeanLawLocked: false, disconnectedForfeit: false },
      { won: false, jeanLawLocked: false, disconnectedForfeit: true },
    ]);

    const app = await buildApp();
    const res = await app.inject({ method: "GET", url: "/api/users/me/stats" });
    expect(res.statusCode).toBe(200);
    const stats = res.json().data;
    expect(stats.matchesPlayed).toBe(4);
    expect(stats.matchesWon).toBe(2);
    expect(stats.matchesLost).toBe(2);
    expect(stats.winRate).toBe(50);
    expect(stats.humiliations).toBe(1);
    expect(stats.forfeits).toBe(1);
  });
});
