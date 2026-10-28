import { describe, expect, it } from "vitest";
import { isJeanLawFlipped } from "../src/abilities/jeanLaw.js";
import { ALL_NAMED_ROLES, MAX_PLAYERS, MIN_PLAYERS } from "../src/config/gameConfig.js";
import { reduce } from "../src/reduce.js";
import { pickRoles } from "../src/roles/assignRoles.js";
import { createRng } from "../src/rng.js";
import type { GameState, RoleId } from "../src/types.js";
import { computeVision } from "../src/vision/visionRules.js";
import { viewFor } from "../src/vision/viewFor.js";
import { FULL_CAST, byRole, gameWithRoles, inPhase } from "./fixtures.js";
import { T0 } from "./helpers.js";

// Plan §7 item 16: edge role cases.

function use(state: GameState, type: "DEBUSSY_REVEAL" | "JEANLAW_LOCK", actor: RoleId, target: RoleId) {
  return reduce(
    state,
    { type, playerId: byRole(state, actor).id, targetId: byRole(state, target).id },
    T0,
    createRng(1)
  ).state;
}

describe("Tara Bai", () => {
  it("with Lutfunnesa: Siraj's two entries are identical apart from the seat", () => {
    const a = gameWithRoles(["NAWAB_SIRAJ", "LUTFUNNESA", "TARA_BAI", "LOYALIST", "LOYALIST", "MIR_JAFAR", "MIR_MADAN"]);
    const b = gameWithRoles(["NAWAB_SIRAJ", "TARA_BAI", "LUTFUNNESA", "LOYALIST", "LOYALIST", "MIR_JAFAR", "MIR_MADAN"]);
    // Swapping the real one and the decoy gives Siraj exactly the same view.
    expect(computeVision(a, byRole(a, "NAWAB_SIRAJ"))).toEqual(computeVision(b, byRole(b, "NAWAB_SIRAJ")));
    expect(computeVision(a, byRole(a, "LUTFUNNESA"))).toHaveLength(2);
  });

  it("without Lutfunnesa: the dealer never produces it", () => {
    for (let n = MIN_PLAYERS; n <= MAX_PLAYERS; n++) {
      for (let seed = 0; seed < 100; seed++) {
        const roles = pickRoles(n, ALL_NAMED_ROLES, createRng(seed));
        if (roles.includes("TARA_BAI")) expect(roles).toContain("LUTFUNNESA");
      }
    }
  });

  it("without Lutfunnesa (forced): Siraj sees only the decoy, nothing breaks", () => {
    const state = gameWithRoles(["NAWAB_SIRAJ", "TARA_BAI", "LOYALIST", "LOYALIST", "LOYALIST", "EIC_SPY"]);
    expect(computeVision(state, byRole(state, "NAWAB_SIRAJ"))).toEqual([
      { playerId: "p1", seat: 1, label: { kind: "ROLE", role: "LUTFUNNESA" } },
    ]);
  });

  it("Tara Bai herself only gets normal Red recognition", () => {
    const full = gameWithRoles(FULL_CAST);
    expect(computeVision(full, byRole(full, "TARA_BAI")).every((v) => v.label.kind === "RED")).toBe(true);
  });
});

describe("Rai Durlabh against every vision", () => {
  const full = gameWithRoles(FULL_CAST);
  const rai = byRole(full, "RAI_DURLABH");

  for (const viewer of FULL_CAST.filter((r) => r !== "RAI_DURLABH")) {
    it(`is not in ${viewer}'s vision`, () => {
      const state = inPhase(full, "DISCUSSION", 1); // Mir Madan's vision is active here
      expect(computeVision(state, byRole(state, viewer)).map((v) => v.playerId)).not.toContain(rai.id);
    });
  }

  it("shows as a Loyalist to de Bussy, who never learns the real role", () => {
    const state = use(full, "DEBUSSY_REVEAL", "DE_BUSSY", "RAI_DURLABH");
    const view = viewFor(state, byRole(state, "DE_BUSSY").id);
    expect(view.reveals[0]?.role).toBe("LOYALIST");
    expect(JSON.stringify(view)).not.toContain("RAI_DURLABH");
  });

  it("still learns de Bussy's real role from the reveal", () => {
    const state = use(full, "DEBUSSY_REVEAL", "DE_BUSSY", "RAI_DURLABH");
    expect(viewFor(state, rai.id).reveals[0]?.role).toBe("DE_BUSSY");
  });
});

describe("de Bussy on other hidden roles", () => {
  it("sees Tara Bai's real role, not a disguise", () => {
    const full = gameWithRoles(FULL_CAST);
    const state = use(full, "DEBUSSY_REVEAL", "DE_BUSSY", "TARA_BAI");
    expect(viewFor(state, byRole(state, "DE_BUSSY").id).reveals[0]?.role).toBe("TARA_BAI");
  });

  it("sees Jagat Seth's real role", () => {
    const full = gameWithRoles(FULL_CAST);
    const state = use(full, "DEBUSSY_REVEAL", "DE_BUSSY", "JAGAT_SETH");
    expect(viewFor(state, byRole(state, "DE_BUSSY").id).reveals[0]?.role).toBe("JAGAT_SETH");
  });
});

describe("Jean Law", () => {
  const full = gameWithRoles(FULL_CAST);

  it("locking a Red does nothing", () => {
    const state = use(full, "JEANLAW_LOCK", "JEAN_LAW", "MIR_JAFAR");
    expect(isJeanLawFlipped(state, byRole(state, "MIR_JAFAR").id)).toBe(false);
  });

  it("locking Gold does nothing", () => {
    const state = use(full, "JEANLAW_LOCK", "JEAN_LAW", "JAGAT_SETH");
    expect(isJeanLawFlipped(state, byRole(state, "JAGAT_SETH").id)).toBe(false);
  });

  it("the locked Green target's view is unchanged", () => {
    const before = viewFor(full, byRole(full, "SAINT_FRASY").id);
    const state = use(full, "JEANLAW_LOCK", "JEAN_LAW", "SAINT_FRASY");
    expect(viewFor(state, byRole(state, "SAINT_FRASY").id)).toEqual(before);
  });

  it("Jean Law is a normal Red for recognition", () => {
    const vision = computeVision(full, byRole(full, "JEAN_LAW"));
    expect(vision.length).toBeGreaterThan(0);
    expect(vision.every((v) => v.label.kind === "RED")).toBe(true);
  });
});

describe("Jagat Seth absent", () => {
  it("a 6-player game has no Gold and every view works", () => {
    const state = gameWithRoles(["NAWAB_SIRAJ", "LUTFUNNESA", "MIR_MADAN", "LOYALIST", "MIR_JAFAR", "UMICHAD"]);
    for (const p of state.players) {
      expect(() => viewFor(state, p.id)).not.toThrow();
    }
    // Mir Jafar's only fellow Red is Umichad, who is hidden: he sees nobody.
    expect(computeVision(state, byRole(state, "MIR_JAFAR"))).toEqual([]);
    expect(computeVision(state, byRole(state, "MIR_MADAN")).map((v) => v.seat)).toEqual([4, 5]);
  });
});

describe("disconnect edge cases", () => {
  // Covered with the reconnection module, which adds presence to the engine.
  it.todo("disconnected Leader");
  it.todo("disconnected minister");
  it.todo("disconnect during an endgame guess");
});
