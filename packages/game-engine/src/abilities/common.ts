import { findPlayer, type Step } from "../phases/common.js";
import type { ErrorCode, NamedRoleId } from "../types.js";

/**
 * Shared checks for once-per-game targeted abilities.
 * [DEFAULT] Usable in any Discussion phase, on any other player.
 */
export function checkTargetedAbility(
  step: Step,
  playerId: string,
  targetId: string,
  role: NamedRoleId,
  alreadyUsed: boolean
): ErrorCode | null {
  const { state } = step;
  const actor = findPlayer(state, playerId);
  if (!actor) return "NOT_IN_GAME";
  if (actor.role !== role) return "NOT_YOUR_ABILITY";
  if (state.phase !== "DISCUSSION") return "WRONG_PHASE";
  if (alreadyUsed) return "ABILITY_ALREADY_USED";
  if (targetId === playerId || !findPlayer(state, targetId)) return "INVALID_TARGET";
  return null;
}
