import type { FillerRoleId, NamedRoleId, RoleId, Team } from "../types.js";

export interface RoleDefinition {
  id: RoleId;
  team: Team;
  name: string;
  /** Roles that must also be in the game when this one is (§4.2 dependencies). */
  requires: readonly NamedRoleId[];
}

export const ROLE_CATALOG: Readonly<Record<RoleId, RoleDefinition>> = {
  NAWAB_SIRAJ: { id: "NAWAB_SIRAJ", team: "GREEN", name: "Nawab Siraj ud-Daulah", requires: [] },
  LUTFUNNESA: { id: "LUTFUNNESA", team: "GREEN", name: "Lutfunnesa", requires: [] },
  MIR_MADAN: { id: "MIR_MADAN", team: "GREEN", name: "Mir Madan", requires: ["MIR_JAFAR"] },
  MOHON_LAL: {
    id: "MOHON_LAL",
    team: "GREEN",
    name: "Mohon Lal",
    requires: ["MIR_MADAN", "GHASHETI_BEGUM"],
  },
  SAINT_FRASY: { id: "SAINT_FRASY", team: "GREEN", name: "Saint Frais", requires: [] },
  DE_BUSSY: { id: "DE_BUSSY", team: "GREEN", name: "de Bussy", requires: [] },
  RAJA_RAMNARAIN: { id: "RAJA_RAMNARAIN", team: "GREEN", name: "Raja Ramnarain", requires: [] },
  MIR_JAFAR: { id: "MIR_JAFAR", team: "RED", name: "Mir Jafar", requires: ["MIR_MADAN"] },
  UMICHAD: { id: "UMICHAD", team: "RED", name: "Umichad", requires: [] },
  JEAN_LAW: { id: "JEAN_LAW", team: "RED", name: "Jean Law", requires: [] },
  GHASHETI_BEGUM: { id: "GHASHETI_BEGUM", team: "RED", name: "Ghasheti Begum", requires: [] },
  YAR_LUTUF: { id: "YAR_LUTUF", team: "RED", name: "Yar Lutuf", requires: [] },
  TARA_BAI: {
    id: "TARA_BAI",
    team: "RED",
    name: "Tara Bai",
    requires: ["NAWAB_SIRAJ", "LUTFUNNESA"],
  },
  RAI_DURLABH: { id: "RAI_DURLABH", team: "RED", name: "Rai Durlabh", requires: [] },
  JAGAT_SETH: {
    id: "JAGAT_SETH",
    team: "GOLD",
    name: "Jagat Seth",
    requires: ["MIR_JAFAR", "RAI_DURLABH"],
  },
  LOYALIST: { id: "LOYALIST", team: "GREEN", name: "Loyalist", requires: [] },
  EIC_SPY: { id: "EIC_SPY", team: "RED", name: "EIC Spy", requires: [] },
};

export const FILLER_FOR_TEAM: Readonly<Record<"GREEN" | "RED", FillerRoleId>> = {
  GREEN: "LOYALIST",
  RED: "EIC_SPY",
};

export function teamOf(role: RoleId): Team {
  return ROLE_CATALOG[role].team;
}

/** The role plus everything it transitively requires. */
export function dependencyClosure(role: NamedRoleId): NamedRoleId[] {
  const seen = new Set<NamedRoleId>();
  const stack: NamedRoleId[] = [role];
  while (stack.length > 0) {
    const current = stack.pop() as NamedRoleId;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const required of ROLE_CATALOG[current].requires) {
      stack.push(required);
    }
  }
  return [...seen];
}
