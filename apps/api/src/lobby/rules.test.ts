import { describe, expect, it } from "vitest";
import {
  joinError,
  kickError,
  leaveError,
  pickNewHost,
  pickQuickJoin,
  settingsError,
  type LobbyRoom,
} from "./rules.js";

const t = (minute: number) => new Date(Date.UTC(2026, 9, 26, 10, minute));

function room(overrides: Partial<LobbyRoom> = {}, players = ["host", "p1", "p2"]): LobbyRoom {
  return {
    id: "r1",
    hostUserId: "host",
    status: "WAITING",
    maxPlayers: 6,
    isPublic: true,
    bannedUserIds: [],
    createdAt: t(0),
    players: players.map((userId, i) => ({ userId, createdAt: t(i) })),
    ...overrides,
  };
}

describe("joinError", () => {
  it("lets a new player into an open lobby", () => {
    expect(joinError(room(), "newbie")).toBeNull();
  });

  it("rejects members, started games, bans and full rooms", () => {
    expect(joinError(room(), "p1")).toBe("ALREADY_IN_ROOM");
    expect(joinError(room({ status: "IN_PROGRESS" }), "newbie")).toBe("GAME_ALREADY_STARTED");
    expect(joinError(room({ bannedUserIds: ["newbie"] }), "newbie")).toBe("BANNED");
    expect(joinError(room({ maxPlayers: 6 }, ["a", "b", "c", "d", "e", "f"]), "newbie")).toBe("ROOM_FULL");
  });

  it("reports ALREADY_IN_ROOM even after the game started, so rejoining works", () => {
    expect(joinError(room({ status: "IN_PROGRESS" }), "p1")).toBe("ALREADY_IN_ROOM");
  });
});

describe("leaveError", () => {
  it("allows leaving a lobby or a finished game, not a running one", () => {
    expect(leaveError(room(), "p1")).toBeNull();
    expect(leaveError(room({ status: "FINISHED" }), "p1")).toBeNull();
    expect(leaveError(room({ status: "IN_PROGRESS" }), "p1")).toBe("GAME_IN_PROGRESS");
    expect(leaveError(room(), "stranger")).toBe("NOT_IN_ROOM");
  });
});

describe("kickError", () => {
  it("lets the host kick another member in the lobby", () => {
    expect(kickError(room(), "host", "p1")).toBeNull();
  });

  it("rejects non-hosts, self-kicks, non-members and started games", () => {
    expect(kickError(room(), "p1", "p2")).toBe("NOT_HOST");
    expect(kickError(room(), "host", "host")).toBe("CANNOT_KICK_SELF");
    expect(kickError(room(), "host", "stranger")).toBe("NOT_IN_ROOM");
    expect(kickError(room({ status: "IN_PROGRESS" }), "host", "p1")).toBe("GAME_ALREADY_STARTED");
  });
});

describe("settingsError", () => {
  it("lets the host change settings in the lobby", () => {
    expect(settingsError(room(), "host", { discussionSeconds: 60 })).toBeNull();
  });

  it("rejects non-hosts, started games and a max below the current count", () => {
    expect(settingsError(room(), "p1", { isPublic: false })).toBe("NOT_HOST");
    expect(settingsError(room({ status: "IN_PROGRESS" }), "host", { isPublic: false })).toBe("GAME_ALREADY_STARTED");
    const seven = room({ maxPlayers: 10 }, ["host", "a", "b", "c", "d", "e", "f"]);
    expect(settingsError(seven, "host", { maxPlayers: 6 })).toBe("MAX_BELOW_PLAYER_COUNT");
    expect(settingsError(seven, "host", { maxPlayers: 7 })).toBeNull();
  });
});

describe("pickNewHost", () => {
  it("picks the longest-present remaining player", () => {
    expect(pickNewHost(room({}, ["host", "p1", "p2"]), "host")).toBe("p1");
  });

  it("doesn't depend on the order players are listed in", () => {
    const r = room();
    r.players.reverse();
    expect(pickNewHost(r, "host")).toBe("p1");
  });

  it("prefers an online player over an offline one who joined earlier", () => {
    expect(pickNewHost(room(), "host", (id) => id !== "p1")).toBe("p2");
  });

  it("falls back to the longest-present player when nobody is online", () => {
    expect(pickNewHost(room(), "host", () => false)).toBe("p1");
  });

  it("returns null when the room empties", () => {
    expect(pickNewHost(room({}, ["host"]), "host")).toBeNull();
  });
});

describe("pickQuickJoin", () => {
  it("picks the fullest joinable public room, oldest first on ties", () => {
    const rooms = [
      room({ id: "small", createdAt: t(0) }, ["a"]),
      room({ id: "big-new", createdAt: t(5) }, ["a", "b", "c"]),
      room({ id: "big-old", createdAt: t(1) }, ["d", "e", "f"]),
    ];
    expect(pickQuickJoin(rooms, "me")?.id).toBe("big-old");
  });

  it("skips private, full, started and banned rooms", () => {
    const rooms = [
      room({ id: "private", isPublic: false }),
      room({ id: "full", maxPlayers: 6 }, ["a", "b", "c", "d", "e", "f"]),
      room({ id: "started", status: "IN_PROGRESS" }),
      room({ id: "banned", bannedUserIds: ["me"] }),
      room({ id: "ok" }, ["x"]),
    ];
    expect(pickQuickJoin(rooms, "me")?.id).toBe("ok");
  });

  it("skips rooms the user is already in", () => {
    expect(pickQuickJoin([room({ id: "mine" }, ["me", "a", "b"])], "me")).toBeNull();
  });

  it("returns null when nothing is open", () => {
    expect(pickQuickJoin([], "me")).toBeNull();
  });
});
