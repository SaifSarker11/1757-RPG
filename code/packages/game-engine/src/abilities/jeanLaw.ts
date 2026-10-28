import type { Step } from "../phases/common.js";
import type { ErrorCode } from "../types.js";
import { checkTargetedAbility } from "./common.js";

/**
 * Jean Law silently locks onto one player (§1). If the target is Green, their
 * win condition flips at the end of the match; on Red or Gold nothing happens.
 * The target is never told, and Jean Law is not told whether it worked.
 */
export function jeanLawLock(step: Step, playerId: string, targetId: string): ErrorCode | null {
  const { state } = step;
  const error = checkTargetedAbility(
    step,
    playerId,
    targetId,
    "JEAN_LAW",
    state.abilities.jeanLaw !== null
  );
  if (error) return error;

  state.abilities.jeanLaw = { targetId, round: state.round };
  step.events.push({ type: "PRIVATE_VIEW_CHANGED", playerIds: [playerId] });
  return null;
}

/** True when the lock landed on a Green player, whose win credit then flips. */
export function isJeanLawFlipped(state: Step["state"], playerId: string): boolean {
  const lock = state.abilities.jeanLaw;
  if (!lock || lock.targetId !== playerId) return false;
  return state.players.find((p) => p.id === playerId)?.team === "GREEN";
}
