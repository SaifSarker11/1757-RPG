import type { GameState } from "../types.js";
import type { Step } from "./common.js";

export function isPaused(state: GameState): boolean {
  return state.pausedRemainingMs != null;
}

/** Freezes the phase timer, keeping the time that was left. No-op without a running timer. */
export function pause(step: Step): void {
  const { state } = step;
  if (isPaused(state) || state.endsAt === null) return;
  const remainingMs = Math.max(0, state.endsAt - step.now);
  state.pausedRemainingMs = remainingMs;
  state.endsAt = null;
  step.events.push({ type: "GAME_PAUSED", remainingMs });
}

/** Restarts a paused timer from where it stopped. No-op when not paused. */
export function resume(step: Step): void {
  const { state } = step;
  if (!isPaused(state)) return;
  const endsAt = step.now + (state.pausedRemainingMs ?? 0);
  state.endsAt = endsAt;
  state.pausedRemainingMs = null;
  step.events.push({ type: "GAME_RESUMED", endsAt });
}
