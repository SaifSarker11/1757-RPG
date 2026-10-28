import type { NamedRoleId, RoleId, Team } from "@repo/game-engine";

/**
 * Client copy of the engine rules the custom-room lobby needs for live hints.
 * The web bundler can't load the engine's runtime code (TS source with `.js`
 * imports), so only types come from it. Keep in step with
 * packages/game-engine/src/roles/catalog.ts and config/gameConfig.ts; the
 * server re-checks everything when the game starts.
 */

export const MIN_PLAYERS = 6;
export const MAX_PLAYERS = 15;
export const TOTAL_ROUNDS = 5;
export const DISCUSSION_SECONDS = { min: 30, max: 300, default: 120 } as const;

export const ROLE_INFO: Readonly<Record<RoleId, { name: string; team: Team; requires: readonly NamedRoleId[] }>> = {
  NAWAB_SIRAJ: { name: "Nawab Siraj ud-Daulah", team: "GREEN", requires: [] },
  LUTFUNNESA: { name: "Lutfunnesa", team: "GREEN", requires: [] },
  MIR_MADAN: { name: "Mir Madan", team: "GREEN", requires: ["MIR_JAFAR"] },
  MOHON_LAL: { name: "Mohon Lal", team: "GREEN", requires: ["MIR_MADAN", "GHASHETI_BEGUM"] },
  SAINT_FRASY: { name: "Saint Frais", team: "GREEN", requires: [] },
  DE_BUSSY: { name: "de Bussy", team: "GREEN", requires: [] },
  RAJA_RAMNARAIN: { name: "Raja Ramnarain", team: "GREEN", requires: [] },
  MIR_JAFAR: { name: "Mir Jafar", team: "RED", requires: ["MIR_MADAN"] },
  UMICHAD: { name: "Umichad", team: "RED", requires: [] },
  JEAN_LAW: { name: "Jean Law", team: "RED", requires: [] },
  GHASHETI_BEGUM: { name: "Ghasheti Begum", team: "RED", requires: [] },
  YAR_LUTUF: { name: "Yar Lutuf", team: "RED", requires: [] },
  TARA_BAI: { name: "Tara Bai", team: "RED", requires: ["NAWAB_SIRAJ", "LUTFUNNESA"] },
  RAI_DURLABH: { name: "Rai Durlabh", team: "RED", requires: [] },
  JAGAT_SETH: { name: "Jagat Seth", team: "GOLD", requires: ["MIR_JAFAR", "RAI_DURLABH"] },
  LOYALIST: { name: "Loyalist", team: "GREEN", requires: [] },
  EIC_SPY: { name: "EIC Spy", team: "RED", requires: [] },
};

export const ALL_NAMED_ROLES = Object.keys(ROLE_INFO).filter(
  (r) => r !== "LOYALIST" && r !== "EIC_SPY"
) as NamedRoleId[];

/** Green / Red / Gold seats per player count. */
export const TEAM_SEATS: Readonly<Record<number, Record<Team, number>>> = {
  6: { GREEN: 4, RED: 2, GOLD: 0 },
  7: { GREEN: 4, RED: 3, GOLD: 0 },
  8: { GREEN: 5, RED: 3, GOLD: 0 },
  9: { GREEN: 5, RED: 3, GOLD: 1 },
  10: { GREEN: 5, RED: 4, GOLD: 1 },
  11: { GREEN: 6, RED: 4, GOLD: 1 },
  12: { GREEN: 6, RED: 5, GOLD: 1 },
  13: { GREEN: 7, RED: 5, GOLD: 1 },
  14: { GREEN: 7, RED: 6, GOLD: 1 },
  15: { GREEN: 7, RED: 7, GOLD: 1 },
};

/** The role plus everything it transitively requires. */
export function dependencyClosure(role: NamedRoleId): NamedRoleId[] {
  const seen = new Set<NamedRoleId>();
  const stack: NamedRoleId[] = [role];
  while (stack.length > 0) {
    const current = stack.pop() as NamedRoleId;
    if (seen.has(current)) continue;
    seen.add(current);
    stack.push(...ROLE_INFO[current].requires);
  }
  return [...seen];
}
