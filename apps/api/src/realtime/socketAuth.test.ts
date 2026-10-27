import { describe, expect, it, vi } from "vitest";
import type { Socket } from "socket.io";
import type { SessionUser } from "../lib/session.js";
import { createSocketAuth, socketUser } from "./socketAuth.js";

const alice: SessionUser = { id: "alice", name: "Alice", isAnonymous: false };

function fakeSocket(handshake: { headers?: Record<string, string>; auth?: unknown }) {
  const join = vi.fn().mockResolvedValue(undefined);
  const socket = {
    handshake: { headers: handshake.headers ?? {}, auth: handshake.auth ?? {} },
    data: {},
    join,
  } as unknown as Socket;
  return { socket, join };
}

describe("createSocketAuth", () => {
  it("attaches the session user and joins their private channel", async () => {
    const { socket, join } = fakeSocket({ headers: { cookie: "session=abc" } });
    const next = vi.fn();
    await createSocketAuth(async (headers) => (headers.cookie ? alice : null))(socket, next);
    expect(next).toHaveBeenCalledWith();
    expect(socketUser(socket)).toEqual(alice);
    expect(join).toHaveBeenCalledWith("user:alice");
  });

  it("turns auth.token into a bearer header", async () => {
    const { socket } = fakeSocket({ auth: { token: "tok-123" } });
    const resolve = vi.fn().mockResolvedValue(alice);
    await createSocketAuth(resolve)(socket, vi.fn());
    expect(resolve.mock.calls[0]?.[0]).toMatchObject({ authorization: "Bearer tok-123" });
  });

  it("accepts anonymous connections without a user", async () => {
    const { socket, join } = fakeSocket({});
    const next = vi.fn();
    await createSocketAuth(async () => null)(socket, next);
    expect(next).toHaveBeenCalledWith();
    expect(socketUser(socket)).toBeNull();
    expect(join).not.toHaveBeenCalled();
  });

  it("refuses the connection if the session lookup throws", async () => {
    const { socket } = fakeSocket({});
    const next = vi.fn();
    await createSocketAuth(async () => {
      throw new Error("db down");
    })(socket, next);
    expect(next.mock.calls[0]?.[0]).toBeInstanceOf(Error);
  });
});
