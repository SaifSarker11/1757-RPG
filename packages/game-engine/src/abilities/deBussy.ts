import type { Step } from "../phases/common.js";
import type { ErrorCode } from "../types.js";
import { checkTargetedAbility } from "./common.js";

/**
 * de Bussy locks onto one player and both learn each other's exact role (§4.2).
 * Rai Durlabh shows up as a Loyalist; that masking happens in `viewFor`.
 */
export function deBussyReveal(step: Step, playerId: string, targetId: string): ErrorCode | null {
  const { state } = step;
  const error = checkTargetedAbility(
    step,
    playerId,
    targetId,
    "DE_BUSSY",
    state.abilities.deBussy !== null
  );
  if (error) return error;

  state.abilities.deBussy = { targetId, round: state.round };
  step.events.push({ type: "PRIVATE_VIEW_CHANGED", playerIds: [playerId, targetId] });
  return null;
}
