import { describe, expect, it, vi } from "vitest";
import type { Server } from "socket.io";
import { createSocketNotifier } from "./notifier.js";
import { inviteUrl, toLobbyListing, toRoomDetail, type RoomRow } from "./views.js";

const t = (minute: number) => new Date(Date.UTC(2026, 9, 26, 10, minute));

function row(overrides: Partial<RoomRow> = {}): RoomRow {
  return {
    id: "room-1",
    code: "AB12CD",
    hostUserId: "u1",
    status: "WAITING",
    maxPlayers: 8,
    isPublic: true,
    discussionSeconds: 90,
    enabledRoles: ["NAWAB_SIRAJ", "DE_BUSSY"],
    bannedUserIds: ["banned"],
    currentRound: 0,
    greenWins: 0,
    redWins: 0,
    createdAt: t(0),
    players: [
      { userId: "u2", role: "MIR_JAFAR", createdAt: t(2), user: { name: "Bea" } },
      { userId: "u1", role: "NAWAB_SIRAJ", createdAt: t(1), user: { name: "Ali" } },
      { userId: "guest-abcd", role: null, createdAt: t(3), user: null },
    ],
    ...overrides,
  };
}

describe("toRoomDetail", () => {
  it("lists players in join order with names and the live count", () => {
    const detail = toRoomDetail(row());
    expect(detail.players).toEqual([
      { userId: "u1", name: "Ali" },
      { userId: "u2", name: "Bea" },
      { userId: "guest-abcd", name: "Player abcd" },
    ]);
    expect(detail.playerCount).toBe(3);
    expect(detail.code).toBe("AB12CD");
  });

  it("never exposes who holds which role, or the ban list", () => {
    const detail = toRoomDetail(row({ status: "IN_PROGRESS" }));
    expect(detail.players.every((p) => Object.keys(p).sort().join() === "name,userId")).toBe(true);
    expect(JSON.stringify(detail)).not.toContain("banned");
    expect(detail.rolesInPlay).toEqual(["MIR_JAFAR", "NAWAB_SIRAJ"]);
  });

  it("shows no roles in the lobby", () => {
    expect(toRoomDetail(row()).rolesInPlay).toEqual([]);
  });
});

describe("inviteUrl", () => {
  it("builds a join link on the web app", () => {
    expect(inviteUrl("AB12CD", "https://1757.example/")).toBe("https://1757.example/join/AB12CD");
  });
});

describe("toLobbyListing", () => {
  it("shows the host's name and the player count", () => {
    expect(toLobbyListing(row())).toEqual({
      id: "room-1",
      code: "AB12CD",
      hostName: "Ali",
      playerCount: 3,
      maxPlayers: 8,
      discussionSeconds: 90,
    });
  });
});

describe("createSocketNotifier", () => {
  function fakeIo() {
    const emitted: Array<[string, string, unknown]> = [];
    const io = {
      to: (channel: string) => ({
        emit: (event: string, payload: unknown) => {
          emitted.push([channel, event, payload]);
          return true;
        },
      }),
    } as unknown as Server;
    return { io, emitted };
  }

  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  it("pushes the public list to the lobby channel", async () => {
    const { io, emitted } = fakeIo();
    const listing = toLobbyListing(row());
    const notifier = createSocketNotifier(io, {
      listPublicRooms: async () => [listing],
      loadRoom: async () => null,
      onError: vi.fn(),
    });
    notifier.lobbyChanged();
    await flush();
    expect(emitted).toEqual([["lobby", "lobby:list", [listing]]]);
  });

  it("pushes the room and its settings to the room channel", async () => {
    const { io, emitted } = fakeIo();
    const detail = toRoomDetail(row());
    const notifier = createSocketNotifier(io, {
      listPublicRooms: async () => [],
      loadRoom: async () => detail,
      onError: vi.fn(),
    });
    notifier.roomChanged("room-1");
    await flush();
    expect(emitted.map(([channel, event]) => [channel, event])).toEqual([
      ["room-1", "room:update"],
      ["room-1", "room:settings"],
    ]);
    expect(emitted[1]?.[2]).toEqual({
      maxPlayers: 8,
      discussionSeconds: 90,
      enabledRoles: ["NAWAB_SIRAJ", "DE_BUSSY"],
      isPublic: true,
    });
  });

  it("tells the kicked player privately and the room publicly", () => {
    const { io, emitted } = fakeIo();
    const notifier = createSocketNotifier(io, {
      listPublicRooms: async () => [],
      loadRoom: async () => null,
      onError: vi.fn(),
    });
    notifier.playerKicked("room-1", "u2");
    expect(emitted).toEqual([
      ["user:u2", "room:kicked", { roomId: "room-1" }],
      ["room-1", "room:player-kicked", { userId: "u2" }],
    ]);
  });

  it("reports failures instead of throwing", async () => {
    const { io } = fakeIo();
    const onError = vi.fn();
    const notifier = createSocketNotifier(io, {
      listPublicRooms: async () => {
        throw new Error("db down");
      },
      loadRoom: async () => null,
      onError,
    });
    notifier.lobbyChanged();
    await flush();
    expect(onError).toHaveBeenCalledOnce();
  });
});
