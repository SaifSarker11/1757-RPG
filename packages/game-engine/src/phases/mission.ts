import { ALLOWED_CARDS, TIMEOUT_DEFAULTS, getSabotagesToFail } from "../config/gameConfig.js";
import { type Rng, shuffle } from "../rng.js";
import type { Card, ErrorCode, PlayerState } from "../types.js";
import { findPlayer, type Step } from "./common.js";
import { recordRoundResult } from "./round.js";

/** Cards this player may play. Mission cards are never weighted. */
export function allowedCardsFor(player: PlayerState): readonly Card[] {
  return ALLOWED_CARDS[player.team];
}

export function playCard(step: Step, rng: Rng, playerId: string, card: Card): ErrorCode | null {
  const { state } = step;
  const player = findPlayer(state, playerId);
  if (!player) return "NOT_IN_GAME";
  if (state.phase !== "RESOLUTION") return "WRONG_PHASE";
  if (!state.ministerIds.includes(playerId)) return "NOT_A_MINISTER";
  if (state.cards[playerId] !== undefined) return "ALREADY_PLAYED";
  if (!allowedCardsFor(player).includes(card)) return "CARD_NOT_ALLOWED";

  state.cards[playerId] = card;
  step.events.push({ type: "CARD_PLAYED", playerId });

  if (state.ministerIds.every((id) => state.cards[id] !== undefined)) {
    resolveMission(step, rng);
  }
  return null;
}

/** RESOLUTION ran out: missing cards count as Success (§4.5). */
export function resolutionTimedOut(step: Step, rng: Rng): void {
  const { state } = step;
  for (const id of state.ministerIds) {
    state.cards[id] ??= TIMEOUT_DEFAULTS.card;
  }
  resolveMission(step, rng);
}

function resolveMission(step: Step, rng: Rng): void {
  const { state } = step;
  const played = state.ministerIds.map((id) => state.cards[id] as Card);
  const sabotageCount = played.filter((c) => c === "SABOTAGE").length;
  const successCount = played.length - sabotageCount;
  const failed = sabotageCount >= getSabotagesToFail(state.players.length, state.round);
  const winner = failed ? "RED" : "GREEN";

  step.events.push({
    type: "MISSION_RESOLVED",
    round: state.round,
    cards: shuffle(played, rng),
    successCount,
    sabotageCount,
    winner,
  });
  recordRoundResult(step, {
    round: state.round,
    winner,
    reason: "MISSION",
    successCount,
    sabotageCount,
  });
}
