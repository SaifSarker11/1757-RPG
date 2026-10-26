import { describe, expect, it } from "vitest";
import { ALL_NAMED_ROLES, MAX_PLAYERS, MIN_PLAYERS } from "../src/config/gameConfig.js";
import { createGame } from "../src/createGame.js";
import { reduce } from "../src/reduce.js";
import { createRng, randomInt } from "../src/rng.js";
import type { GameState, Phase, PlayerState, RoleId } from "../src/types.js";
import type { VisionLabel } from "../src/vision/types.js";
import { viewFor } from "../src/vision/viewFor.js";
import { T0, playerIds } from "./helpers.js";

const ROLE_IDS: RoleId[] = [...ALL_NAMED_ROLES, "LOYALIST", "EIC_SPY"];
const SEEDS = 40;
const PHASES: Array<[Phase, number]> = [
  ["ROLE_REVEAL", 1],
  ["DISCUSSION", 1],
  ["SELECTION", 1],
  ["DISCUSSION", 3],
  ["BALLOT", 4],
];

/** Independent oracle for §4.2: may `viewer` see `target` with this label? */
function isAllowed(viewer: PlayerState, target: PlayerState, label: VisionLabel, state: GameState) {
  const r = target.role;
  switch (label.kind) {
    case "ROLE":
      if (viewer.role === "NAWAB_SIRAJ") return label.role === "LUTFUNNESA" && (r === "LUTFUNNESA" || r === "TARA_BAI");
      if (viewer.role === "LUTFUNNESA") return label.role === "NAWAB_SIRAJ" && (r === "NAWAB_SIRAJ" || r === "TARA_BAI");
      if (viewer.role === "RAJA_RAMNARAIN") return label.role === "NAWAB_SIRAJ" && r === "NAWAB_SIRAJ";
      return false;
    case "RED":
      if (target.team !== "RED" || r === "RAI_DURLABH") return false;
      if (viewer.role === "MIR_MADAN") return state.round === 1 && state.phase === "DISCUSSION";
      return viewer.team === "RED" && viewer.role !== "UMICHAD" && r !== "UMICHAD";
    case "SUSPECT":
      return viewer.role === "MOHON_LAL" && (r === "MIR_MADAN" || r === "GHASHETI_BEGUM");
  }
}

function randomGames(): GameState[] {
  const games: GameState[] = [];
  for (let n = MIN_PLAYERS; n <= MAX_PLAYERS; n++) {
    for (let seed = 0; seed < SEEDS; seed++) {
      const rng = createRng(seed * 31 + n);
      const { state } = createGame({ playerIds: playerIds(n), now: T0, rng });
      for (const [phase, round] of PHASES) {
        games.push({ ...state, phase, round });
      }
    }
  }
  return games;
}

describe("viewFor leak test", { timeout: 60_000 }, () => {
  const games = randomGames();

  it("never lists another player's role or team before POST_GAME", () => {
    for (const state of games) {
      for (const viewer of state.players) {
        const view = viewFor(state, viewer.id);
        for (const p of view.game.players) {
          expect(p.role).toBeUndefined();
          expect(p.team).toBeUndefined();
        }
      }
    }
  });

  it("every vision entry is allowed by §4.2", () => {
    for (const state of games) {
      for (const viewer of state.players) {
        for (const entry of viewFor(state, viewer.id).vision) {
          const target = state.players.find((p) => p.id === entry.playerId);
          expect(target).toBeDefined();
          expect(entry.seat).toBe(target?.seat);
          expect(isAllowed(viewer, target as PlayerState, entry.label, state)).toBe(true);
        }
      }
    }
  });

  it("vision is complete: every allowed RED/SUSPECT/ROLE target is listed", () => {
    for (const state of games) {
      for (const viewer of state.players) {
        const seen = new Set(viewFor(state, viewer.id).vision.map((v) => v.playerId));
        for (const target of state.players.filter((p) => p.id !== viewer.id)) {
          const shouldSee = (["ROLE", "RED", "SUSPECT"] as const).some((kind) => {
            const label: VisionLabel =
              kind === "ROLE"
                ? { kind, role: viewer.role === "NAWAB_SIRAJ" ? "LUTFUNNESA" : "NAWAB_SIRAJ" }
                : { kind };
            return isAllowed(viewer, target, label, state);
          });
          expect(seen.has(target.id)).toBe(shouldSee);
        }
      }
    }
  });

  it("Rai Durlabh and Jagat Seth are in nobody's vision", () => {
    for (const state of games) {
      const hidden = state.players
        .filter((p) => p.role === "RAI_DURLABH" || p.role === "JAGAT_SETH")
        .map((p) => p.id);
      for (const viewer of state.players) {
        for (const entry of viewFor(state, viewer.id).vision) {
          expect(hidden).not.toContain(entry.playerId);
        }
      }
    }
  });

  it("no role id appears anywhere outside `me` and `vision` without an ability", () => {
    for (const state of games) {
      for (const viewer of state.players) {
        const { me: _me, vision: _vision, ...rest } = viewFor(state, viewer.id);
        const text = JSON.stringify(rest);
        for (const role of ROLE_IDS) {
          expect(text).not.toContain(`"${role}"`);
        }
      }
    }
  });

  it("vision entries are in seat order", () => {
    for (const state of games) {
      for (const viewer of state.players) {
        const seats = viewFor(state, viewer.id).vision.map((v) => v.seat);
        expect(seats).toEqual([...seats].sort((a, b) => a - b));
      }
    }
  });
});

describe("leak test with abilities used", { timeout: 60_000 }, () => {
  it("reveals and lock targets reach only the players involved", () => {
    for (let seed = 0; seed < 200; seed++) {
      const rng = createRng(seed);
      const { state: start } = createGame({ playerIds: playerIds(15), now: T0, rng });
      let state: GameState = { ...start, phase: "DISCUSSION" };
      const deBussy = state.players.find((p) => p.role === "DE_BUSSY");
      const jeanLaw = state.players.find((p) => p.role === "JEAN_LAW");
      if (!deBussy || !jeanLaw) throw new Error("15 players should have the full cast");

      const pick = (exclude: string) => {
        const others = state.players.filter((p) => p.id !== exclude);
        return others[randomInt(rng, others.length)] as PlayerState;
      };
      const dbTarget = pick(deBussy.id);
      const jlTarget = pick(jeanLaw.id);
      state = reduce(state, { type: "DEBUSSY_REVEAL", playerId: deBussy.id, targetId: dbTarget.id }, T0, rng).state;
      state = reduce(state, { type: "JEANLAW_LOCK", playerId: jeanLaw.id, targetId: jlTarget.id }, T0, rng).state;

      for (const viewer of state.players) {
        const view = viewFor(state, viewer.id);
        const involved = viewer.id === deBussy.id || viewer.id === dbTarget.id;
        expect(view.reveals.length).toBe(involved ? 1 : 0);
        if (viewer.id === deBussy.id) {
          expect(view.reveals[0]?.role).toBe(dbTarget.role === "RAI_DURLABH" ? "LOYALIST" : dbTarget.role);
        }
        if (viewer.id === dbTarget.id) {
          expect(view.reveals[0]?.role).toBe("DE_BUSSY");
        }
        expect(view.jeanLawTargetId).toBe(viewer.id === jeanLaw.id ? jlTarget.id : null);
      }
    }
  });
});
