import type { Card, GameSettings, NamedRoleId, Phase, RoleId, Team } from "../types.js";

// Every tunable game rule lives here. Values marked [DEFAULT] are guesses
// from plan §1/§4 and are expected to change after playtests.

export const MIN_PLAYERS = 6;
export const MAX_PLAYERS = 15;
export const TOTAL_ROUNDS = 5;
export const ROUNDS_TO_WIN = 3;
/** A round goes to Red when this many nominations in it are rejected. */
export const FAIL_TRACK_LIMIT = 5;

export interface Composition {
  green: number;
  red: number;
  gold: number;
  /** Ministers per round, R1–R5. */
  teamSizes: readonly [number, number, number, number, number];
  /** Sabotage cards needed to fail Round 4. Every other round fails on 1. */
  round4SabotagesToFail: number;
}

/** Plan §4.3 [DEFAULT, tune after playtests]. */
export const COMPOSITION: Readonly<Record<number, Composition>> = {
  6: { green: 4, red: 2, gold: 0, teamSizes: [2, 3, 4, 3, 4], round4SabotagesToFail: 1 },
  7: { green: 4, red: 3, gold: 0, teamSizes: [2, 3, 3, 4, 4], round4SabotagesToFail: 2 },
  8: { green: 5, red: 3, gold: 0, teamSizes: [3, 4, 4, 5, 5], round4SabotagesToFail: 2 },
  9: { green: 5, red: 3, gold: 1, teamSizes: [3, 4, 4, 5, 5], round4SabotagesToFail: 2 },
  10: { green: 5, red: 4, gold: 1, teamSizes: [3, 4, 4, 5, 5], round4SabotagesToFail: 2 },
  11: { green: 6, red: 4, gold: 1, teamSizes: [3, 4, 5, 6, 6], round4SabotagesToFail: 2 },
  12: { green: 6, red: 5, gold: 1, teamSizes: [3, 4, 5, 6, 6], round4SabotagesToFail: 2 },
  13: { green: 7, red: 5, gold: 1, teamSizes: [4, 5, 5, 6, 7], round4SabotagesToFail: 2 },
  14: { green: 7, red: 6, gold: 1, teamSizes: [4, 5, 5, 6, 7], round4SabotagesToFail: 2 },
  15: { green: 7, red: 7, gold: 1, teamSizes: [4, 5, 6, 6, 7], round4SabotagesToFail: 2 },
};

export function getComposition(playerCount: number): Composition {
  const composition = COMPOSITION[playerCount];
  if (!composition) {
    throw new RangeError(
      `Player count must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}, got ${playerCount}`
    );
  }
  return composition;
}

export function getTeamSize(playerCount: number, round: number): number {
  const size = getComposition(playerCount).teamSizes[round - 1];
  if (size === undefined) {
    throw new RangeError(`Round must be between 1 and ${TOTAL_ROUNDS}, got ${round}`);
  }
  return size;
}

export function getSabotagesToFail(playerCount: number, round: number): number {
  return round === 4 ? getComposition(playerCount).round4SabotagesToFail : 1;
}

/** Phase durations in seconds (§4.5). DISCUSSION comes from the host setting. */
export const PHASE_SECONDS: Readonly<Record<Exclude<Phase, "DISCUSSION" | "POST_GAME">, number>> = {
  ROLE_REVEAL: 15,
  SELECTION: 60, // [DEFAULT]
  BALLOT: 30,
  RESOLUTION: 30, // [DEFAULT]
  ROUND_RESULT: 8, // [DEFAULT] not in the plan; time to show the card reveal
  ENDGAME: 60, // [DEFAULT]
};

export const DISCUSSION_SECONDS = { min: 30, max: 300, default: 120 } as const;

/** Defaults applied when a phase times out (§4.5). */
export const TIMEOUT_DEFAULTS = {
  vote: "APPROVE",
  card: "SUCCESS",
} as const;

/**
 * [DEFAULT] When Jagat Seth can't be placed (disabled by the host, or his
 * dependencies don't fit), the Gold slot becomes a Green Loyalist.
 */
export const GOLD_SLOT_FALLBACK_TEAM = "GREEN" as const;

/**
 * Ballot vote weights (§1). They apply only to the Approve/Reject ballot on
 * the nominated ministers, never to mission cards. Every other role weighs 1.
 */
export const BALLOT_WEIGHTS: Readonly<Partial<Record<RoleId, number>>> = {
  SAINT_FRASY: 2,
  YAR_LUTUF: 2,
};

export function ballotWeight(role: RoleId): number {
  return BALLOT_WEIGHTS[role] ?? 1;
}

/**
 * Cards each team may play on a mission (§4.4). Greens can only play Success.
 * [DEFAULT] Jagat Seth (Gold) may play either.
 */
export const ALLOWED_CARDS: Readonly<Record<Team, readonly Card[]>> = {
  GREEN: ["SUCCESS"],
  RED: ["SUCCESS", "SABOTAGE"],
  GOLD: ["SUCCESS", "SABOTAGE"],
};

/** Mir Jafar's endgame guess must find this role (§4.6). */
export const MIR_JAFAR_TARGET: RoleId = "MIR_MADAN";

/**
 * Jagat Seth's target depends on the provisional winner after Mir Jafar's
 * guess (§4.6) [DEFAULT].
 */
export const JAGAT_SETH_TARGET: Readonly<Record<"GREEN" | "RED", RoleId>> = {
  RED: "RAI_DURLABH",
  GREEN: "MIR_JAFAR",
};

/** [DEFAULT] Mir Madan sees the Reds only during Round 1's Discussion (§4.2). */
export const MIR_MADAN_VISION: { round: number; phases: readonly Phase[] } = {
  round: 1,
  phases: ["DISCUSSION"],
};

/** [DEFAULT] What de Bussy is shown when he reveals Rai Durlabh. */
export const RAI_DURLABH_DISGUISE = "LOYALIST" as const;

export const ALL_NAMED_ROLES: readonly NamedRoleId[] = [
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

export const DEFAULT_SETTINGS: Readonly<GameSettings> = {
  discussionSeconds: DISCUSSION_SECONDS.default,
  enabledRoles: [...ALL_NAMED_ROLES],
};
