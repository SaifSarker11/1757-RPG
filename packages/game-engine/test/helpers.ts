import { createGame } from "../src/createGame.js";
import { getTeamSize } from "../src/config/gameConfig.js";
import { reduce } from "../src/reduce.js";
import { createRng, type Rng } from "../src/rng.js";
import type { Action, Card, GameEvent, GameState, Phase, Vote } from "../src/types.js";

export const T0 = 1_000_000;

export function playerIds(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `p${i}`);
}

/** Small driver that threads state, time and rng through `reduce`. */
export class Harness {
  state: GameState;
  now: number;
  readonly rng: Rng;
  log: GameEvent[] = [];

  constructor(players = 6, seed = 1, discussionSeconds = 30) {
    this.rng = createRng(seed);
    this.now = T0;
    const { state, events } = createGame({
      playerIds: playerIds(players),
      settings: { discussionSeconds },
      now: this.now,
      rng: this.rng,
    });
    this.state = state;
    this.log.push(...events);
  }

  dispatch(action: Action): GameEvent[] {
    const { state, events } = reduce(this.state, action, this.now, this.rng);
    this.state = state;
    this.log.push(...events);
    return events;
  }

  /** Jumps the clock to the current phase's deadline and ticks. */
  timeout(): GameEvent[] {
    if (this.state.endsAt === null) throw new Error(`Phase ${this.state.phase} has no timer`);
    this.now = this.state.endsAt;
    return this.dispatch({ type: "TICK" });
  }

  /** Times out phases until `phase` is reached. */
  advanceTo(phase: Phase): void {
    for (let guard = 0; this.state.phase !== phase; guard++) {
      if (guard > 50) throw new Error(`Never reached ${phase}`);
      this.timeout();
    }
  }

  get leaderId(): string {
    const leader = this.state.players.find((p) => p.seat === this.state.leaderSeat);
    if (!leader) throw new Error("No leader");
    return leader.id;
  }

  teamSize(): number {
    return getTeamSize(this.state.players.length, this.state.round);
  }

  /** Leader nominates the first N players by seat. */
  nominateFirst(): void {
    this.advanceTo("SELECTION");
    const ministers = this.state.players.slice(0, this.teamSize()).map((p) => p.id);
    this.dispatch({ type: "NOMINATE", playerId: this.leaderId, ministerIds: ministers });
  }

  voteAll(vote: Vote): void {
    for (const p of this.state.players) {
      this.dispatch({ type: "CAST_VOTE", playerId: p.id, vote });
    }
  }

  playAll(card: Card): void {
    for (const id of [...this.state.ministerIds]) {
      this.dispatch({ type: "PLAY_CARD", playerId: id, card });
    }
  }

  /** Plays one full approved round where every minister plays `card`. */
  playRound(card: Card): void {
    this.nominateFirst();
    this.voteAll("APPROVE");
    this.playAll(card);
    this.timeout(); // leave ROUND_RESULT
  }
}

export function eventsOfType<T extends GameEvent["type"]>(
  events: GameEvent[],
  type: T
): Extract<GameEvent, { type: T }>[] {
  return events.filter((e): e is Extract<GameEvent, { type: T }> => e.type === type);
}
