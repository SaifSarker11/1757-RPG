import { enterPhase, type Step } from "./phases/common.js";
import { type Rng, randomInt } from "./rng.js";
import { assignRoles } from "./roles/assignRoles.js";
import { resolveSettings } from "./settings.js";
import type { GameSettings, GameState, ReduceResult } from "./types.js";

export interface CreateGameInput {
  /** Seat order is the order of this array. */
  playerIds: readonly string[];
  settings?: Partial<GameSettings>;
  now: number;
  rng: Rng;
}

/** Deals roles, picks a random first Leader and opens ROLE_REVEAL. */
export function createGame(input: CreateGameInput): ReduceResult {
  const settings = resolveSettings(input.settings);
  const players = assignRoles(input.playerIds, settings, input.rng);

  const state: GameState = {
    players,
    settings,
    phase: "ROLE_REVEAL",
    endsAt: null,
    round: 1,
    attempt: 1,
    leaderSeat: randomInt(input.rng, players.length),
    failTrack: 0,
    ministerIds: [],
    votes: {},
    cards: {},
    roundResults: [],
    nominations: [],
    abilities: { deBussy: null, jeanLaw: null },
    outcome: null,
  };

  const step: Step = { state, events: [], now: input.now };
  enterPhase(step, "ROLE_REVEAL");
  return { state: step.state, events: step.events };
}
