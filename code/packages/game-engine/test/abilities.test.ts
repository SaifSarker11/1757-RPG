import { describe, expect, it } from "vitest";
import { isJeanLawFlipped } from "../src/abilities/jeanLaw.js";
import { reduce } from "../src/reduce.js";
import { createRng } from "../src/rng.js";
import type { Action, GameState, RoleId } from "../src/types.js";
import { FULL_CAST, byRole, gameWithRoles, inPhase } from "./fixtures.js";
import { T0, eventsOfType } from "./helpers.js";

function act(state: GameState, action: Action) {
  return reduce(state, action, T0, createRng(1));
}

function rejection(state: GameState, action: Action) {
  return eventsOfType(act(state, action).events, "ACTION_REJECTED")[0]?.code;
}

const full = gameWithRoles(FULL_CAST);
const id = (role: RoleId) => byRole(full, role).id;

describe("DEBUSSY_REVEAL", () => {
  it("records the target and tells both players their view changed", () => {
    const { state, events } = act(full, {
      type: "DEBUSSY_REVEAL",
      playerId: id("DE_BUSSY"),
      targetId: id("MIR_JAFAR"),
    });
    expect(state.abilities.deBussy).toEqual({ targetId: id("MIR_JAFAR"), round: 1 });
    expect(events).toEqual([
      { type: "PRIVATE_VIEW_CHANGED", playerIds: [id("DE_BUSSY"), id("MIR_JAFAR")] },
    ]);
  });

  it("works once per game", () => {
    const { state } = act(full, {
      type: "DEBUSSY_REVEAL",
      playerId: id("DE_BUSSY"),
      targetId: id("MIR_JAFAR"),
    });
    expect(
      rejection(state, { type: "DEBUSSY_REVEAL", playerId: id("DE_BUSSY"), targetId: id("UMICHAD") })
    ).toBe("ABILITY_ALREADY_USED");
  });

  it("is only for de Bussy", () => {
    expect(
      rejection(full, { type: "DEBUSSY_REVEAL", playerId: id("LUTFUNNESA"), targetId: id("UMICHAD") })
    ).toBe("NOT_YOUR_ABILITY");
  });

  it("is only usable in Discussion", () => {
    const state = inPhase(full, "SELECTION");
    expect(
      rejection(state, { type: "DEBUSSY_REVEAL", playerId: id("DE_BUSSY"), targetId: id("UMICHAD") })
    ).toBe("WRONG_PHASE");
  });

  it("needs another player in the game as the target", () => {
    expect(
      rejection(full, { type: "DEBUSSY_REVEAL", playerId: id("DE_BUSSY"), targetId: id("DE_BUSSY") })
    ).toBe("INVALID_TARGET");
    expect(
      rejection(full, { type: "DEBUSSY_REVEAL", playerId: id("DE_BUSSY"), targetId: "ghost" })
    ).toBe("INVALID_TARGET");
  });

  it("works in a later round's Discussion", () => {
    const state = inPhase(full, "DISCUSSION", 3);
    const result = act(state, {
      type: "DEBUSSY_REVEAL",
      playerId: id("DE_BUSSY"),
      targetId: id("UMICHAD"),
    });
    expect(result.state.abilities.deBussy?.round).toBe(3);
  });
});

describe("JEANLAW_LOCK", () => {
  it("is silent: only Jean Law's view changes", () => {
    const { state, events } = act(full, {
      type: "JEANLAW_LOCK",
      playerId: id("JEAN_LAW"),
      targetId: id("SAINT_FRASY"),
    });
    expect(state.abilities.jeanLaw).toEqual({ targetId: id("SAINT_FRASY"), round: 1 });
    expect(events).toEqual([{ type: "PRIVATE_VIEW_CHANGED", playerIds: [id("JEAN_LAW")] }]);
  });

  it("works once per game and only for Jean Law, in Discussion", () => {
    const { state } = act(full, {
      type: "JEANLAW_LOCK",
      playerId: id("JEAN_LAW"),
      targetId: id("SAINT_FRASY"),
    });
    expect(
      rejection(state, { type: "JEANLAW_LOCK", playerId: id("JEAN_LAW"), targetId: id("DE_BUSSY") })
    ).toBe("ABILITY_ALREADY_USED");
    expect(
      rejection(full, { type: "JEANLAW_LOCK", playerId: id("MIR_JAFAR"), targetId: id("DE_BUSSY") })
    ).toBe("NOT_YOUR_ABILITY");
    expect(
      rejection(inPhase(full, "BALLOT"), {
        type: "JEANLAW_LOCK",
        playerId: id("JEAN_LAW"),
        targetId: id("DE_BUSSY"),
      })
    ).toBe("WRONG_PHASE");
  });

  it("flips a Green target only", () => {
    for (const [target, flipped] of [
      ["SAINT_FRASY", true],
      ["NAWAB_SIRAJ", true],
      ["MIR_JAFAR", false],
      ["JAGAT_SETH", false],
    ] as const) {
      const { state } = act(full, {
        type: "JEANLAW_LOCK",
        playerId: id("JEAN_LAW"),
        targetId: id(target),
      });
      expect(isJeanLawFlipped(state, id(target))).toBe(flipped);
    }
  });

  it("flips nobody before it is used", () => {
    expect(full.players.some((p) => isJeanLawFlipped(full, p.id))).toBe(false);
  });
});
