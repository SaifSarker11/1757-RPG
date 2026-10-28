import { describe, expect, it } from "vitest";
import { computeVision } from "../src/vision/visionRules.js";
import type { GameState, RoleId } from "../src/types.js";
import { FULL_CAST, atSeat, byRole, gameWithRoles, inPhase } from "./fixtures.js";

function visionOf(state: GameState, role: RoleId) {
  return computeVision(state, byRole(state, role));
}

function seatsOf(state: GameState, roles: RoleId[]): number[] {
  return roles.map((r) => byRole(state, r).seat).sort((a, b) => a - b);
}

const full = gameWithRoles(FULL_CAST);

describe("Nawab Siraj", () => {
  it("sees Lutfunnesa and Tara Bai, both labelled Lutfunnesa", () => {
    const vision = visionOf(full, "NAWAB_SIRAJ");
    expect(vision.map((v) => v.seat)).toEqual(seatsOf(full, ["LUTFUNNESA", "TARA_BAI"]));
    expect(vision.every((v) => v.label.kind === "ROLE" && v.label.role === "LUTFUNNESA")).toBe(true);
  });

  it("sees only Lutfunnesa without Tara Bai", () => {
    const state = gameWithRoles(["NAWAB_SIRAJ", "LUTFUNNESA", "LOYALIST", "LOYALIST", "EIC_SPY", "EIC_SPY"]);
    expect(visionOf(state, "NAWAB_SIRAJ")).toEqual([
      { playerId: "p1", seat: 1, label: { kind: "ROLE", role: "LUTFUNNESA" } },
    ]);
  });
});

describe("Lutfunnesa", () => {
  it("sees Siraj and Tara Bai, both labelled Nawab", () => {
    const vision = visionOf(full, "LUTFUNNESA");
    expect(vision.map((v) => v.seat)).toEqual(seatsOf(full, ["NAWAB_SIRAJ", "TARA_BAI"]));
    expect(vision.every((v) => v.label.kind === "ROLE" && v.label.role === "NAWAB_SIRAJ")).toBe(true);
  });
});

describe("Raja Ramnarain", () => {
  it("sees only the real Siraj, unaffected by Tara Bai", () => {
    const siraj = byRole(full, "NAWAB_SIRAJ");
    expect(visionOf(full, "RAJA_RAMNARAIN")).toEqual([
      { playerId: siraj.id, seat: siraj.seat, label: { kind: "ROLE", role: "NAWAB_SIRAJ" } },
    ]);
  });
});

describe("Mir Madan", () => {
  it("sees every Red except Rai Durlabh during Round 1 Discussion", () => {
    const vision = visionOf(inPhase(full, "DISCUSSION", 1), "MIR_MADAN");
    const expected = full.players
      .filter((p) => p.team === "RED" && p.role !== "RAI_DURLABH")
      .map((p) => p.seat);
    expect(vision.map((v) => v.seat)).toEqual(expected);
    expect(vision.every((v) => v.label.kind === "RED")).toBe(true);
    expect(vision.map((v) => v.seat)).toContain(byRole(full, "UMICHAD").seat);
  });

  it("loses the vision outside Round 1 Discussion", () => {
    for (const [phase, round] of [
      ["ROLE_REVEAL", 1],
      ["SELECTION", 1],
      ["BALLOT", 1],
      ["DISCUSSION", 2],
    ] as const) {
      expect(visionOf(inPhase(full, phase, round), "MIR_MADAN")).toEqual([]);
    }
  });
});

describe("Mohon Lal", () => {
  it("sees Mir Madan and Ghasheti Begum as unlabelled suspects", () => {
    const vision = visionOf(full, "MOHON_LAL");
    expect(vision.map((v) => v.seat)).toEqual(seatsOf(full, ["MIR_MADAN", "GHASHETI_BEGUM"]));
    expect(vision.map((v) => v.label)).toEqual([{ kind: "SUSPECT" }, { kind: "SUSPECT" }]);
  });
});

describe("Red mutual recognition", () => {
  const visibleReds = full.players
    .filter((p) => p.team === "RED" && p.role !== "UMICHAD" && p.role !== "RAI_DURLABH")
    .map((p) => p.seat);

  it("a regular Red sees the other Reds except Umichad and Rai Durlabh", () => {
    const viewer = byRole(full, "YAR_LUTUF");
    expect(visionOf(full, "YAR_LUTUF").map((v) => v.seat)).toEqual(
      visibleReds.filter((s) => s !== viewer.seat)
    );
  });

  it("Rai Durlabh sees the other Reds but is unseen", () => {
    expect(visionOf(full, "RAI_DURLABH").map((v) => v.seat)).toEqual(visibleReds);
  });

  it("Umichad sees nobody", () => {
    expect(visionOf(full, "UMICHAD")).toEqual([]);
  });

  it("an EIC Spy filler is a normal Red", () => {
    const state = gameWithRoles(["NAWAB_SIRAJ", "LOYALIST", "LOYALIST", "LOYALIST", "EIC_SPY", "EIC_SPY"]);
    expect(computeVision(state, atSeat(state, 4))).toEqual([
      { playerId: "p5", seat: 5, label: { kind: "RED" } },
    ]);
  });

  it("Reds see no Gold and no Green", () => {
    for (const p of full.players.filter((x) => x.team === "RED")) {
      for (const v of computeVision(full, p)) {
        expect(full.players[v.seat]?.team).toBe("RED");
      }
    }
  });
});

describe("roles with no vision", () => {
  for (const role of ["SAINT_FRASY", "DE_BUSSY", "JAGAT_SETH"] as const) {
    it(`${role} sees nobody`, () => {
      expect(visionOf(full, role)).toEqual([]);
    });
  }

  it("a Loyalist sees nobody", () => {
    const state = gameWithRoles(["NAWAB_SIRAJ", "LOYALIST", "LOYALIST", "LOYALIST", "EIC_SPY", "EIC_SPY"]);
    expect(computeVision(state, atSeat(state, 1))).toEqual([]);
  });
});

describe("Jagat Seth is invisible", () => {
  it("appears in nobody's vision", () => {
    const seth = byRole(full, "JAGAT_SETH");
    for (const p of full.players) {
      expect(computeVision(full, p).map((v) => v.playerId)).not.toContain(seth.id);
    }
  });
});
