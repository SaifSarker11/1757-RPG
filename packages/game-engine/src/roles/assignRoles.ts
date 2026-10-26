import {
  ALL_NAMED_ROLES,
  GOLD_SLOT_FALLBACK_TEAM,
  getComposition,
} from "../config/gameConfig.js";
import { type Rng, shuffle } from "../rng.js";
import type { GameSettings, NamedRoleId, PlayerState, RoleId, Team } from "../types.js";
import { FILLER_FOR_TEAM, dependencyClosure, teamOf } from "./catalog.js";

type SlotCounts = Record<Team, number>;

/**
 * Picks the roles for a match (§4.2, §4.3).
 *
 * - Nawab Siraj is always in the game.
 * - Jagat Seth is placed first when there is a Gold slot, so his dependencies get room.
 * - Every other enabled role is tried in random order and added with its whole
 *   dependency closure, but only if the closure fits the remaining team slots.
 * - Leftover slots get fillers (Loyalist / EIC Spy).
 */
export function pickRoles(
  playerCount: number,
  enabledRoles: readonly NamedRoleId[],
  rng: Rng
): RoleId[] {
  const composition = getComposition(playerCount);
  const free: SlotCounts = {
    GREEN: composition.green,
    RED: composition.red,
    GOLD: composition.gold,
  };
  const enabled = new Set<NamedRoleId>(enabledRoles);
  enabled.add("NAWAB_SIRAJ");
  const chosen = new Set<NamedRoleId>();

  const tryAdd = (role: NamedRoleId): boolean => {
    const missing = dependencyClosure(role).filter((r) => !chosen.has(r));
    if (missing.some((r) => !enabled.has(r))) return false;

    const needed: SlotCounts = { GREEN: 0, RED: 0, GOLD: 0 };
    for (const r of missing) needed[teamOf(r)] += 1;
    if (needed.GREEN > free.GREEN || needed.RED > free.RED || needed.GOLD > free.GOLD) {
      return false;
    }

    for (const r of missing) {
      chosen.add(r);
      free[teamOf(r)] -= 1;
    }
    return true;
  };

  tryAdd("NAWAB_SIRAJ");
  if (free.GOLD > 0) tryAdd("JAGAT_SETH");

  const rest = ALL_NAMED_ROLES.filter((r) => r !== "NAWAB_SIRAJ" && r !== "JAGAT_SETH");
  for (const role of shuffle(rest, rng)) {
    tryAdd(role);
  }

  const roles: RoleId[] = [...chosen];
  for (let i = 0; i < free.GREEN; i++) roles.push(FILLER_FOR_TEAM.GREEN);
  for (let i = 0; i < free.RED; i++) roles.push(FILLER_FOR_TEAM.RED);
  for (let i = 0; i < free.GOLD; i++) roles.push(FILLER_FOR_TEAM[GOLD_SLOT_FALLBACK_TEAM]);
  return roles;
}

/** Deals roles to players. Seats follow the order of `playerIds`. */
export function assignRoles(
  playerIds: readonly string[],
  settings: Pick<GameSettings, "enabledRoles">,
  rng: Rng
): PlayerState[] {
  if (new Set(playerIds).size !== playerIds.length) {
    throw new Error("Player ids must be unique");
  }

  const roles = shuffle(pickRoles(playerIds.length, settings.enabledRoles, rng), rng);
  return playerIds.map((id, seat) => {
    const role = roles[seat] as RoleId;
    return { id, seat, role, team: teamOf(role) };
  });
}
