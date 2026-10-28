import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EMPTY_LOBBY_TTL_MS, createLobbyCleanup } from "./lobbyCleanup.js";
import { createTimerScheduler } from "./scheduler.js";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function setup(connected: () => number) {
  const deleteIfWaiting = vi.fn(async () => true);
  const onDeleted = vi.fn();
  const cleanup = createLobbyCleanup({
    scheduler: createTimerScheduler(),
    connectedCount: async () => connected(),
    deleteIfWaiting,
    onDeleted,
  });
  return { cleanup, deleteIfWaiting, onDeleted };
}

describe("lobby cleanup", () => {
  it("deletes a lobby that stays empty for 10 minutes", async () => {
    const { cleanup, deleteIfWaiting, onDeleted } = setup(() => 0);
    await cleanup.roomMaybeEmpty("r1");
    await vi.advanceTimersByTimeAsync(EMPTY_LOBBY_TTL_MS - 1);
    expect(deleteIfWaiting).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(deleteIfWaiting).toHaveBeenCalledWith("r1");
    expect(onDeleted).toHaveBeenCalledWith("r1");
  });

  it("does nothing while someone is still connected", async () => {
    const { cleanup, deleteIfWaiting } = setup(() => 1);
    await cleanup.roomMaybeEmpty("r1");
    await vi.advanceTimersByTimeAsync(EMPTY_LOBBY_TTL_MS);
    expect(deleteIfWaiting).not.toHaveBeenCalled();
  });

  it("is cancelled when someone comes back", async () => {
    const { cleanup, deleteIfWaiting } = setup(() => 0);
    await cleanup.roomMaybeEmpty("r1");
    cleanup.roomOccupied("r1");
    await vi.advanceTimersByTimeAsync(EMPTY_LOBBY_TTL_MS);
    expect(deleteIfWaiting).not.toHaveBeenCalled();
  });

  it("re-checks at the deadline in case someone reconnected without a join", async () => {
    let connected = 0;
    const { cleanup, deleteIfWaiting } = setup(() => connected);
    await cleanup.roomMaybeEmpty("r1");
    connected = 1;
    await vi.advanceTimersByTimeAsync(EMPTY_LOBBY_TTL_MS);
    expect(deleteIfWaiting).not.toHaveBeenCalled();
  });

  it("doesn't announce a deletion when the room already started", async () => {
    const { cleanup, deleteIfWaiting, onDeleted } = setup(() => 0);
    deleteIfWaiting.mockResolvedValueOnce(false);
    await cleanup.roomMaybeEmpty("r1");
    await vi.advanceTimersByTimeAsync(EMPTY_LOBBY_TTL_MS);
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
