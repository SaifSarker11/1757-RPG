import { describe, expect, it } from "vitest";
import {
  ALL_NAMED_ROLES,
  MAX_PLAYERS,
  MIN_PLAYERS,
  getComposition,
} from "../src/config/gameConfig.js";
import { ROLE_CATALOG } from "../src/roles/catalog.js";
import { assignRoles, pickRoles } from "../src/roles/assignRoles.js";
import { createRng } from "../src/rng.js";
import type { NamedRoleId, RoleId } from "../src/types.js";

const SEEDS = 300;
const FILLERS: RoleId[] = ["LOYALIST", "EIC_SPY"];

function ids(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `p${i}`);
}

function namedRoles(roles: RoleId[]): NamedRoleId[] {
  return roles.filter((r): r is NamedRoleId => !FILLERS.includes(r));
}

describe("pickRoles (property: every player count x many seeds)", () => {
  for (let n = MIN_PLAYERS; n <= MAX_PLAYERS; n++) {
    it(`holds every invariant for ${n} players`, () => {
      const composition = getComposition(n);
      for (let seed = 0; seed < SEEDS; seed++) {
        const roles = pickRoles(n, ALL_NAMED_ROLES, createRng(seed));
        const named = namedRoles(roles);

        expect(roles).toHaveLength(n);
        expect(new Set(named).size).toBe(named.length);
        expect(named).toContain("NAWAB_SIRAJ");

        for (const role of named) {
          for (const required of ROLE_CATALOG[role].requires) {
            expect(named).toContain(required);
          }
        }

        const red = roles.filter((r) => ROLE_CATALOG[r].team === "RED").length;
        const gold = roles.filter((r) => ROLE_CATALOG[r].team === "GOLD").length;
        const green = roles.filter((r) => ROLE_CATALOG[r].team === "GREEN").length;
        expect(red).toBe(composition.red);
        expect(gold).toBeLessThanOrEqual(composition.gold);
        // An unplaced Gold slot falls back to a Green Loyalist.
        expect(green).toBe(composition.green + (composition.gold - gold));
      }
    });
  }

  it("places Jagat Seth whenever there is a Gold slot and all roles are on", () => {
    for (let n = 9; n <= MAX_PLAYERS; n++) {
      for (let seed = 0; seed < 50; seed++) {
        expect(pickRoles(n, ALL_NAMED_ROLES, createRng(seed))).toContain("JAGAT_SETH");
      }
    }
  });

  it("uses the full named cast at 15 players", () => {
    const roles = pickRoles(15, ALL_NAMED_ROLES, createRng(1));
    expect([...roles].sort()).toEqual([...ALL_NAMED_ROLES].sort());
  });
});

describe("pickRoles with host toggles", () => {
  it("only uses enabled roles, plus Siraj", () => {
    const enabled: NamedRoleId[] = ["DE_BUSSY", "UMICHAD"];
    for (let seed = 0; seed < 50; seed++) {
      const named = namedRoles(pickRoles(8, enabled, createRng(seed)));
      for (const role of named) {
        expect(["NAWAB_SIRAJ", ...enabled]).toContain(role);
      }
    }
  });

  it("always includes Siraj even when every role is off", () => {
    const roles = pickRoles(6, [], createRng(0));
    expect(namedRoles(roles)).toEqual(["NAWAB_SIRAJ"]);
    expect(roles.filter((r) => r === "LOYALIST")).toHaveLength(3);
    expect(roles.filter((r) => r === "EIC_SPY")).toHaveLength(2);
  });

  it("skips a role whose dependency is disabled", () => {
    // Tara Bai needs Lutfunnesa.
    for (let seed = 0; seed < 50; seed++) {
      const roles = pickRoles(10, ["TARA_BAI", "MIR_JAFAR", "MIR_MADAN"], createRng(seed));
      expect(roles).not.toContain("TARA_BAI");
    }
  });

  it("turns the Gold slot into a Loyalist when Jagat Seth is off", () => {
    const enabled = ALL_NAMED_ROLES.filter((r) => r !== "JAGAT_SETH");
    const roles = pickRoles(9, enabled, createRng(4));
    expect(roles).not.toContain("JAGAT_SETH");
    expect(roles.filter((r) => ROLE_CATALOG[r].team === "GREEN")).toHaveLength(6);
  });
});

describe("assignRoles", () => {
  it("gives one role per player, seated in input order", () => {
    const players = assignRoles(ids(10), { enabledRoles: ALL_NAMED_ROLES }, createRng(5));
    expect(players.map((p) => p.id)).toEqual(ids(10));
    expect(players.map((p) => p.seat)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const p of players) {
      expect(p.team).toBe(ROLE_CATALOG[p.role].team);
    }
  });

  it("is deterministic for a seed", () => {
    const a = assignRoles(ids(12), { enabledRoles: ALL_NAMED_ROLES }, createRng(77));
    const b = assignRoles(ids(12), { enabledRoles: ALL_NAMED_ROLES }, createRng(77));
    expect(a).toEqual(b);
  });

  it("rejects duplicate player ids", () => {
    expect(() =>
      assignRoles(["a", "a", "b", "c", "d", "e"], { enabledRoles: ALL_NAMED_ROLES }, createRng(1))
    ).toThrow();
  });

  it("rejects player counts outside 6-15", () => {
    expect(() => assignRoles(ids(5), { enabledRoles: ALL_NAMED_ROLES }, createRng(1))).toThrow(
      RangeError
    );
  });
});
