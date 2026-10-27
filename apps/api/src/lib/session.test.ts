import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { createRequireUser, currentUser, type SessionUser } from "./session.js";

const alice: SessionUser = { id: "user-alice", name: "Alice", isAnonymous: false };

function buildApp(user: SessionUser | null) {
  const app = Fastify();
  const requireUser = createRequireUser(async () => user);
  app.post("/whoami", { preHandler: requireUser }, async (request) => ({ id: currentUser(request).id }));
  return app;
}

describe("requireUser", () => {
  it("rejects requests without a session", async () => {
    const res = await buildApp(null).inject({ method: "POST", url: "/whoami" });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ error: "Unauthorized", code: "UNAUTHORIZED", success: false });
  });

  it("uses the session user, ignoring any userId in the body", async () => {
    const res = await buildApp(alice).inject({
      method: "POST",
      url: "/whoami",
      payload: { userId: "someone-else" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ id: "user-alice" });
  });
});

describe("currentUser", () => {
  it("throws on a route without the hook", async () => {
    const app = Fastify();
    app.get("/open", async (request) => currentUser(request));
    const res = await app.inject({ method: "GET", url: "/open" });
    expect(res.statusCode).toBe(500);
  });
});
