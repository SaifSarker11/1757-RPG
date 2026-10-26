import { MIR_MADAN_VISION, RAI_DURLABH_DISGUISE } from "../config/gameConfig.js";
import type { GameState, PlayerState, RoleId } from "../types.js";
import type { RevealEntry, VisionEntry, VisionLabel } from "./types.js";

/** Reds that other Reds can't see (§4.2 Red mutual recognition). */
const HIDDEN_FROM_REDS: readonly RoleId[] = ["UMICHAD", "RAI_DURLABH"];

function entry(player: PlayerState, label: VisionLabel): VisionEntry {
  return { playerId: player.id, seat: player.seat, label };
}

function withRoles(others: PlayerState[], roles: readonly RoleId[]): PlayerState[] {
  return others.filter((p) => roles.includes(p.role));
}

export function isMirMadanVisionActive(state: GameState): boolean {
  return state.round === MIR_MADAN_VISION.round && MIR_MADAN_VISION.phases.includes(state.phase);
}

/**
 * The players `viewer` can see, and how they appear (§4.2).
 * Entries are sorted by seat so their order says nothing about who is real.
 */
export function computeVision(state: GameState, viewer: PlayerState): VisionEntry[] {
  const others = state.players.filter((p) => p.id !== viewer.id);
  let entries: VisionEntry[];

  switch (viewer.role) {
    case "NAWAB_SIRAJ":
      // Tara Bai poses as a second Lutfunnesa.
      entries = withRoles(others, ["LUTFUNNESA", "TARA_BAI"]).map((p) =>
        entry(p, { kind: "ROLE", role: "LUTFUNNESA" })
      );
      break;
    case "LUTFUNNESA":
      // Tara Bai poses as a second Nawab.
      entries = withRoles(others, ["NAWAB_SIRAJ", "TARA_BAI"]).map((p) =>
        entry(p, { kind: "ROLE", role: "NAWAB_SIRAJ" })
      );
      break;
    case "RAJA_RAMNARAIN":
      entries = withRoles(others, ["NAWAB_SIRAJ"]).map((p) =>
        entry(p, { kind: "ROLE", role: "NAWAB_SIRAJ" })
      );
      break;
    case "MIR_MADAN":
      entries = isMirMadanVisionActive(state)
        ? others
            .filter((p) => p.team === "RED" && p.role !== "RAI_DURLABH")
            .map((p) => entry(p, { kind: "RED" }))
        : [];
      break;
    case "MOHON_LAL":
      entries = withRoles(others, ["MIR_MADAN", "GHASHETI_BEGUM"]).map((p) =>
        entry(p, { kind: "SUSPECT" })
      );
      break;
    case "UMICHAD":
      entries = [];
      break;
    default:
      entries =
        viewer.team === "RED"
          ? others
              .filter((p) => p.team === "RED" && !HIDDEN_FROM_REDS.includes(p.role))
              .map((p) => entry(p, { kind: "RED" }))
          : [];
  }

  return entries.sort((a, b) => a.seat - b.seat);
}

/** Roles learned through de Bussy's reveal, for either side of it. */
export function computeReveals(state: GameState, viewer: PlayerState): RevealEntry[] {
  const lock = state.abilities.deBussy;
  if (!lock) return [];

  const deBussy = state.players.find((p) => p.role === "DE_BUSSY");
  const target = state.players.find((p) => p.id === lock.targetId);
  if (!deBussy || !target) return [];

  if (viewer.id === deBussy.id) {
    const role = target.role === "RAI_DURLABH" ? RAI_DURLABH_DISGUISE : target.role;
    return [{ playerId: target.id, seat: target.seat, role, source: "DE_BUSSY" }];
  }
  if (viewer.id === target.id) {
    return [{ playerId: deBussy.id, seat: deBussy.seat, role: deBussy.role, source: "DE_BUSSY" }];
  }
  return [];
}
