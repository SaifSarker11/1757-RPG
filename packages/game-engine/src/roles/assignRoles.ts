import {
  ALL_NAMED_ROLES,
  GOLD_SLOT_FALLBACK_TEAM,
  getComposition,
} from "../config/gameConfig.js";
import { type Rng, shuffle } from "../rng.js";
import type {
  FillerRoleId,
  GameSettings,
  NamedRoleId,
  PlayerState,
  RoleId,
  Team,
} from "../types.js";
import { FILLER_FOR_TEAM, ROLE_CATALOG, dependencyClosure, teamOf } from "./catalog.js";

type SlotCounts = Record<Team, number>;

const isFiller = (role: RoleId): role is FillerRoleId => role === "LOYALIST" || role === "EIC_SPY";

/**
 * Picks the roles for a match (§4.2, §4.3).
 *
 * - Nawab Siraj is always in the game.
 * - `required` roles (fixed by the host in a custom room) go in first, each
 *   with its whole dependency closure; dependencies are game rules, so they
 *   are added even when the host disabled them. Throws RangeError when the
 *   required roles don't fit the team slots.
 * - Jagat Seth is placed next when there is a Gold slot, so his dependencies get room.
 * - Every other enabled role is tried in random order and added with its whole
 *   dependency closure, but only if the closure fits the remaining team slots.
 * - Leftover slots get fillers (Loyalist / EIC Spy).
 */
export function pickRoles(
  playerCount: number,
  enabledRoles: readonly NamedRoleId[],
  rng: Rng,
  required: readonly RoleId[] = []
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

  const tryAdd = (role: NamedRoleId, force = false): boolean => {
    const missing = dependencyClosure(role).filter((r) => !chosen.has(r));
    if (!force && missing.some((r) => !enabled.has(r))) return false;

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

  const requiredNamed = required.filter((r): r is NamedRoleId => !isFiller(r));
  if (new Set(requiredNamed).size !== requiredNamed.length) {
    throw new RangeError("Each named role can be fixed to one player only");
  }

  tryAdd("NAWAB_SIRAJ", true);
  for (const role of requiredNamed) {
    if (!tryAdd(role, true)) {
      throw new RangeError(
        `${ROLE_CATALOG[role].name} (with the roles it needs) doesn't fit ${playerCount} players`
      );
    }
  }

  // Fixed fillers take their team's slots; a Loyalist may also take the Gold
  // slot, which falls back to Green when Jagat Seth isn't in the game.
  const fixedFillers = { GREEN: 0, RED: 0, GOLD: 0 };
  for (const role of required) {
    if (!isFiller(role)) continue;
    const team = teamOf(role);
    if (free[team] > 0) {
      free[team] -= 1;
    } else if (team === GOLD_SLOT_FALLBACK_TEAM && free.GOLD > 0) {
      free.GOLD -= 1;
    } else {
      throw new RangeError(`Too many ${ROLE_CATALOG[role].name} slots for ${playerCount} players`);
    }
    fixedFillers[team] += 1;
  }

  if (free.GOLD > 0) tryAdd("JAGAT_SETH");

  const rest = ALL_NAMED_ROLES.filter((r) => r !== "NAWAB_SIRAJ" && r !== "JAGAT_SETH");
  for (const role of shuffle(rest, rng)) {
    tryAdd(role);
  }

  const roles: RoleId[] = [...chosen];
  const greenFillers = free.GREEN + fixedFillers.GREEN;
  const redFillers = free.RED + fixedFillers.RED;
  for (let i = 0; i < greenFillers; i++) roles.push(FILLER_FOR_TEAM.GREEN);
  for (let i = 0; i < redFillers; i++) roles.push(FILLER_FOR_TEAM.RED);
  for (let i = 0; i < free.GOLD; i++) roles.push(FILLER_FOR_TEAM[GOLD_SLOT_FALLBACK_TEAM]);
  return roles;
}

/**
 * Deals roles to players. Seats follow the order of `playerIds`.
 * `fixedRoles` pins roles to players (custom rooms); everyone else is dealt
 * at random from what's left.
 */
export function assignRoles(
  playerIds: readonly string[],
  settings: Pick<GameSettings, "enabledRoles">,
  rng: Rng,
  fixedRoles: Readonly<Record<string, RoleId>> = {}
): PlayerState[] {
  if (new Set(playerIds).size !== playerIds.length) {
    throw new Error("Player ids must be unique");
  }

  const fixed = playerIds.flatMap((id) => {
    const role = fixedRoles[id];
    return role ? [[id, role] as const] : [];
  });
  const pool = pickRoles(
    playerIds.length,
    settings.enabledRoles,
    rng,
    fixed.map(([, role]) => role)
  );
  for (const [, role] of fixed) {
    pool.splice(pool.indexOf(role), 1);
  }

  // Without fixed roles this deals exactly as before, so seeded games replay unchanged.
  const dealt = shuffle(pool, rng);
  const fixedById = new Map<string, RoleId>(fixed);
  let next = 0;
  return playerIds.map((id, seat) => {
    const role = fixedById.get(id) ?? (dealt[next++] as RoleId);
    return { id, seat, role, team: teamOf(role) };
  });
}
