import { describe, expect, it } from "vitest";
import { createRoomBody, kickBody, parse, updateSettingsBody } from "./schemas.js";

describe("createRoomBody", () => {
  it("accepts an empty body and strips unknown keys", () => {
    expect(parse(createRoomBody, { hostUserId: "spoofed" })).toEqual({ ok: true, data: {} });
    expect(parse(createRoomBody, undefined)).toEqual({ ok: true, data: {} });
  });

  it("accepts valid settings", () => {
    const body = { maxPlayers: 10, discussionSeconds: 90, enabledRoles: ["DE_BUSSY"], isPublic: false };
    expect(parse(createRoomBody, body)).toEqual({ ok: true, data: body });
  });

  it("enforces 6-15 players", () => {
    expect(parse(createRoomBody, { maxPlayers: 5 }).ok).toBe(false);
    expect(parse(createRoomBody, { maxPlayers: 16 }).ok).toBe(false);
    expect(parse(createRoomBody, { maxPlayers: 7.5 }).ok).toBe(false);
  });

  it("enforces a 30-300 s discussion", () => {
    expect(parse(createRoomBody, { discussionSeconds: 29 }).ok).toBe(false);
    expect(parse(createRoomBody, { discussionSeconds: 301 }).ok).toBe(false);
  });

  it("rejects unknown roles and fillers", () => {
    expect(parse(createRoomBody, { enabledRoles: ["WIZARD"] }).ok).toBe(false);
    expect(parse(createRoomBody, { enabledRoles: ["LOYALIST"] }).ok).toBe(false);
  });

  it("names the failing field", () => {
    const result = parse(createRoomBody, { maxPlayers: 99 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/^maxPlayers:/);
  });
});

describe("updateSettingsBody", () => {
  it("needs at least one setting", () => {
    expect(parse(updateSettingsBody, {}).ok).toBe(false);
    expect(parse(updateSettingsBody, { isPublic: true }).ok).toBe(true);
  });
});

describe("kickBody", () => {
  it("needs a user id", () => {
    expect(parse(kickBody, {}).ok).toBe(false);
    expect(parse(kickBody, { userId: "u1" })).toEqual({ ok: true, data: { userId: "u1" } });
  });
});

describe("custom room settings", () => {
  it("accepts a mode, per-round timers and role assignments", () => {
    const body = {
      mode: "CUSTOM",
      roundDiscussionSeconds: [30, 60, 90, 120, 300],
      roleAssignments: { u1: "MIR_JAFAR", u2: "LOYALIST", u3: "LOYALIST" },
    };
    expect(parse(updateSettingsBody, body)).toEqual({ ok: true, data: body });
  });

  it("rejects bad timers, unknown roles and a named role given twice", () => {
    expect(parse(updateSettingsBody, { mode: "CHAOS" }).ok).toBe(false);
    expect(parse(updateSettingsBody, { roundDiscussionSeconds: [10] }).ok).toBe(false);
    expect(parse(updateSettingsBody, { roundDiscussionSeconds: [60, 60, 60, 60, 60, 60] }).ok).toBe(false);
    expect(parse(updateSettingsBody, { roleAssignments: { u1: "KING" } }).ok).toBe(false);
    expect(parse(updateSettingsBody, { roleAssignments: { u1: "MIR_JAFAR", u2: "MIR_JAFAR" } }).ok).toBe(false);
  });
});
