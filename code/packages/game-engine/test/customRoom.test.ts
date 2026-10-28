import { describe, expect, it } from "vitest";
import { ALL_NAMED_ROLES, MAX_PLAYERS, MIN_PLAYERS, getComposition } from "../src/config/gameConfig.js";
import { createGame } from "../src/createGame.js";
import { reduce } from "../src/reduce.js";
import { assignRoles } from "../src/roles/assignRoles.js";
import { ROLE_CATALOG } from "../src/roles/catalog.js";
import { createRng } from "../src/rng.js";
import { resolveSettings } from "../src/settings.js";
import type { RoleId } from "../src/types.js";
import { T0, playerIds } from "./helpers.js";

describe("custom room: per-round discussion", () => {
  it("validates each round's length", () => {
    expect(resolveSettings({ roundDiscussionSeconds: [30, 60, 90, 120, 300] }).roundDiscussionSeconds)
      .toEqual([30, 60, 90, 120, 300]);
    expect(() => resolveSettings({ roundDiscussionSeconds: [29] })).toThrow(RangeError);
    expect(() => resolveSettings({ roundDiscussionSeconds: [60, 60, 60, 60, 60, 60] })).toThrow(RangeError);
  });

  it("omits the override when none is given", () => {
    expect(resolveSettings({ roundDiscussionSeconds: [] })).not.toHaveProperty("roundDiscussionSeconds");
  });

  it("uses the round's own length for Discussion", () => {
    const rng = createRng(3);
    let { state } = createGame({
      playerIds: playerIds(6),
      settings: { discussionSeconds: 120, roundDiscussionSeconds: [45, 200] },
      now: T0,
      rng,
    });
    state = reduce(state, { type: "SKIP" }, T0, rng).state;
    expect(state.phase).toBe("DISCUSSION");
    expect(state.endsAt).toBe(T0 + 45_000);
  });
});

describe("custom room: SKIP", () => {
  it("ends the phase before its timer", () => {
    const rng = createRng(1);
    const { state } = createGame({ playerIds: playerIds(6), now: T0, rng });
    expect(reduce(state, { type: "TICK" }, T0 + 1, rng).events).toEqual([]);

    const skipped = reduce(state, { type: "SKIP" }, T0 + 1, rng);
    expect(skipped.state.phase).toBe("DISCUSSION");
    // The next phase is timed from the skip, not from the old deadline.
    expect(skipped.state.endsAt).toBe(T0 + 1 + 120_000);
  });

  it("applies the timeout defaults (Selection skip counts as a timed-out nomination)", () => {
    const rng = createRng(1);
    let { state } = createGame({ playerIds: playerIds(6), now: T0, rng });
    state = reduce(state, { type: "SKIP" }, T0, rng).state; // → DISCUSSION
    state = reduce(state, { type: "SKIP" }, T0, rng).state; // → SELECTION
    expect(state.phase).toBe("SELECTION");
    const { events } = reduce(state, { type: "SKIP" }, T0, rng);
    expect(events.some((e) => e.type === "NOMINATION_TIMED_OUT")).toBe(true);
  });
});

describe("custom room: fixed roles", () => {
  it("gives fixed players their roles and deals the rest", () => {
    for (let seed = 0; seed < 100; seed++) {
      const ids = playerIds(10);
      const fixed: Record<string, RoleId> = { p0: "MIR_JAFAR", p3: "DE_BUSSY", p7: "EIC_SPY" };
      const players = assignRoles(ids, { enabledRoles: ALL_NAMED_ROLES }, createRng(seed), fixed);
      expect(players.find((p) => p.id === "p0")?.role).toBe("MIR_JAFAR");
      expect(players.find((p) => p.id === "p3")?.role).toBe("DE_BUSSY");
      expect(players.find((p) => p.id === "p7")?.role).toBe("EIC_SPY");

      const roles = players.map((p) => p.role);
      // Mir Jafar's dependency is dealt to someone.
      expect(roles).toContain("MIR_MADAN");
      const c = getComposition(10);
      expect(players.filter((p) => p.team === "RED")).toHaveLength(c.red);
    }
  });

  it("adds a fixed role's dependencies even when they are disabled", () => {
    const players = assignRoles(playerIds(8), { enabledRoles: [] }, createRng(5), { p1: "MOHON_LAL" });
    const roles = players.map((p) => p.role);
    for (const dep of ["MIR_MADAN", "GHASHETI_BEGUM", "MIR_JAFAR"] as RoleId[]) {
      expect(roles).toContain(dep);
    }
  });

  it("keeps the team counts for every player count with a full fixed table", () => {
    for (let n = MIN_PLAYERS; n <= MAX_PLAYERS; n++) {
      const ids = playerIds(n);
      const dealt = assignRoles(ids, { enabledRoles: ALL_NAMED_ROLES }, createRng(n));
      const fixed = Object.fromEntries(dealt.map((p) => [p.id, p.role]));
      const again = assignRoles(ids, { enabledRoles: ALL_NAMED_ROLES }, createRng(n + 99), fixed);
      expect(again.map((p) => p.role)).toEqual(dealt.map((p) => p.role));
    }
  });

  it("rejects fixed roles that don't fit", () => {
    const tooManyReds: Record<string, RoleId> = { p0: "UMICHAD", p1: "JEAN_LAW", p2: "YAR_LUTUF" };
    expect(() =>
      assignRoles(playerIds(6), { enabledRoles: ALL_NAMED_ROLES }, createRng(1), tooManyReds)
    ).toThrow(RangeError);
    expect(() =>
      assignRoles(playerIds(6), { enabledRoles: ALL_NAMED_ROLES }, createRng(1), {
        p0: "EIC_SPY",
        p1: "EIC_SPY",
        p2: "EIC_SPY",
      })
    ).toThrow(RangeError);
  });

  it("deals unchanged when nothing is fixed", () => {
    const a = assignRoles(playerIds(9), { enabledRoles: ALL_NAMED_ROLES }, createRng(42));
    const b = assignRoles(playerIds(9), { enabledRoles: ALL_NAMED_ROLES }, createRng(42), {});
    expect(b).toEqual(a);
    expect(a.every((p) => ROLE_CATALOG[p.role].team === p.team)).toBe(true);
  });
});
