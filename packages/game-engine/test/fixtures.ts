import { createGame } from "../src/createGame.js";
import { createRng } from "../src/rng.js";
import { teamOf } from "../src/roles/catalog.js";
import type { GameState, Phase, PlayerState, RoleId } from "../src/types.js";
import { T0, playerIds } from "./helpers.js";

/**
 * A game where seat i has roles[i]. Lets tests pick an exact cast,
 * including casts the dealer would never produce.
 */
export function gameWithRoles(
  roles: RoleId[],
  overrides: Partial<Pick<GameState, "phase" | "round">> = {}
): GameState {
  const { state } = createGame({ playerIds: playerIds(roles.length), now: T0, rng: createRng(1) });
  state.players = state.players.map((p, seat) => {
    const role = roles[seat] as RoleId;
    return { ...p, role, team: teamOf(role) };
  });
  state.phase = overrides.phase ?? "DISCUSSION";
  state.round = overrides.round ?? 1;
  state.endsAt = T0 + 60_000;
  return state;
}

export function byRole(state: GameState, role: RoleId): PlayerState {
  const player = state.players.find((p) => p.role === role);
  if (!player) throw new Error(`No ${role} in this game`);
  return player;
}

export function atSeat(state: GameState, seat: number): PlayerState {
  const player = state.players[seat];
  if (!player) throw new Error(`No player at seat ${seat}`);
  return player;
}

export function inPhase(state: GameState, phase: Phase, round = state.round): GameState {
  return { ...state, phase, round };
}

/** The 15-player full cast, one named role per seat. */
export const FULL_CAST: RoleId[] = [
  "NAWAB_SIRAJ",
  "LUTFUNNESA",
  "MIR_MADAN",
  "MOHON_LAL",
  "SAINT_FRASY",
  "DE_BUSSY",
  "RAJA_RAMNARAIN",
  "MIR_JAFAR",
  "UMICHAD",
  "JEAN_LAW",
  "GHASHETI_BEGUM",
  "YAR_LUTUF",
  "TARA_BAI",
  "RAI_DURLABH",
  "JAGAT_SETH",
];
