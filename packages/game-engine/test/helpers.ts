import { createGame } from "../src/createGame.js";
import { getTeamSize } from "../src/config/gameConfig.js";
import { reduce } from "../src/reduce.js";
import { createRng, type Rng } from "../src/rng.js";
import { teamOf } from "../src/roles/catalog.js";
import type { Action, Card, GameEvent, GameState, Phase, RoleId, Vote } from "../src/types.js";

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

  /** `roles`, when given, replaces the dealt roles seat by seat. */
  constructor(players = 6, seed = 1, discussionSeconds = 30, roles?: RoleId[]) {
    this.rng = createRng(seed);
    this.now = T0;
    const { state, events } = createGame({
      playerIds: playerIds(players),
      settings: { discussionSeconds },
      now: this.now,
      rng: this.rng,
    });
    if (roles) {
      if (roles.length !== players) throw new Error("roles must match the player count");
      state.players = state.players.map((p, seat) => {
        const role = roles[seat] as RoleId;
        return { ...p, role, team: teamOf(role) };
      });
    }
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

  /** Leader nominates exactly these ministers. */
  nominate(ministerIds: string[]): void {
    this.advanceTo("SELECTION");
    this.dispatch({ type: "NOMINATE", playerId: this.leaderId, ministerIds });
  }

  /** Leader nominates the first N players by seat. */
  nominateFirst(): void {
    this.nominate(this.state.players.slice(0, this.teamSize()).map((p) => p.id));
  }

  /** A team that can produce `card`: for Sabotage, non-Greens go first. */
  ministersFor(card: Card): string[] {
    const players = [...this.state.players];
    if (card === "SABOTAGE") {
      players.sort((a, b) => Number(a.team === "GREEN") - Number(b.team === "GREEN"));
    }
    return players.slice(0, this.teamSize()).map((p) => p.id);
  }

  /** First non-Green among the current ministers. */
  saboteurId(): string {
    const id = this.state.ministerIds.find(
      (m) => this.state.players.find((p) => p.id === m)?.team !== "GREEN"
    );
    if (!id) throw new Error("No minister can sabotage");
    return id;
  }

  voteAll(vote: Vote): void {
    for (const p of this.state.players) {
      this.dispatch({ type: "CAST_VOTE", playerId: p.id, vote });
    }
  }

  /** Every minister plays `card`; Greens fall back to Success since they can't sabotage. */
  playAll(card: Card): void {
    for (const id of [...this.state.ministerIds]) {
      const green = this.state.players.find((p) => p.id === id)?.team === "GREEN";
      this.dispatch({ type: "PLAY_CARD", playerId: id, card: green ? "SUCCESS" : card });
    }
  }

  /** Plays one full approved round whose result is decided by `card`. */
  playRound(card: Card): void {
    this.nominate(this.ministersFor(card));
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
