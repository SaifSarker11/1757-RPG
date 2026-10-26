import { describe, expect, it } from "vitest";
import { gameActionPayload, realtimeError, toEngineAction } from "./schemas.js";

describe("gameActionPayload", () => {
  it("accepts every action type", () => {
    const actions = [
      { type: "NOMINATE", ministerIds: ["a", "b"] },
      { type: "CAST_VOTE", vote: "APPROVE" },
      { type: "PLAY_CARD", card: "SABOTAGE" },
      { type: "DEBUSSY_REVEAL", targetId: "a" },
      { type: "JEANLAW_LOCK", targetId: "a" },
      { type: "GUESS", targetId: "a" },
    ];
    for (const action of actions) {
      expect(gameActionPayload.safeParse({ roomId: "r1", action }).success).toBe(true);
    }
  });

  it("strips a client-supplied playerId", () => {
    const parsed = gameActionPayload.parse({
      roomId: "r1",
      action: { type: "CAST_VOTE", vote: "REJECT", playerId: "spoofed" },
    });
    expect(parsed.action).toEqual({ type: "CAST_VOTE", vote: "REJECT" });
    expect(toEngineAction(parsed.action, "real")).toEqual({
      type: "CAST_VOTE",
      vote: "REJECT",
      playerId: "real",
    });
  });

  it("rejects unknown types, bad values and server-only actions", () => {
    for (const action of [
      { type: "TICK" },
      { type: "CAST_VOTE", vote: "MAYBE" },
      { type: "PLAY_CARD", card: "green" },
      { type: "NOMINATE", ministerIds: [] },
      { type: "GUESS" },
    ]) {
      expect(gameActionPayload.safeParse({ roomId: "r1", action }).success).toBe(false);
    }
  });

  it("needs a room id", () => {
    expect(gameActionPayload.safeParse({ action: { type: "CAST_VOTE", vote: "APPROVE" } }).success).toBe(false);
  });
});

describe("realtimeError", () => {
  it("has a readable message for every code", () => {
    expect(realtimeError("RATE_LIMITED")).toEqual({ code: "RATE_LIMITED", message: "Slow down" });
    expect(realtimeError("NOT_LEADER").message).toBe("not leader");
  });
});
