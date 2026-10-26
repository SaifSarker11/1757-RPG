import {
  ALL_NAMED_ROLES,
  MAX_PLAYERS,
  MIN_PLAYERS,
  createGame,
  createRng,
  matchSummary,
  reduce,
  roundWins,
  viewFor,
  type Action,
  type GameEvent,
  type GameState,
  type NamedRoleId,
} from "@repo/game-engine";
import type { PlayerIdentity } from "../persistence/matchRecord.js";
import type { GameRoomRepository } from "./roomRepository.js";
import type { Scheduler } from "./scheduler.js";
import { realtimeError, toEngineAction, type ClientAction, type RealtimeError } from "./schemas.js";
import { SNAPSHOT_VERSION, type GameSnapshot, type SnapshotStore } from "./snapshotStore.js";
import { publicEvents, type GameTransport } from "./transport.js";

/** Plan §5: a finished match's live state is dropped 30 min after POST_GAME. */
export const FINISHED_RETENTION_MS = 30 * 60 * 1000;

export interface GameServiceDeps {
  store: SnapshotStore;
  scheduler: Scheduler;
  repo: GameRoomRepository;
  transport: GameTransport;
  now?: () => number;
  randomSeed?: () => number;
  logError?: (error: unknown, message: string) => void;
  finishedRetentionMs?: number;
}

const tickKey = (roomId: string) => `tick:${roomId}`;
const disposeKey = (roomId: string) => `dispose:${roomId}`;

/**
 * Runs every live match (plan §5). The engine state lives in memory and is
 * snapshotted to Redis after every transition; work for one room is
 * serialized so actions and timer ticks never interleave.
 */
export class GameService {
  private readonly games = new Map<string, GameSnapshot>();
  private readonly queues = new Map<string, Promise<unknown>>();
  private readonly now: () => number;
  private readonly randomSeed: () => number;
  private readonly logError: (error: unknown, message: string) => void;
  private readonly retentionMs: number;

  constructor(private readonly deps: GameServiceDeps) {
    this.now = deps.now ?? Date.now;
    this.randomSeed = deps.randomSeed ?? (() => Math.floor(Math.random() * 2 ** 31));
    this.logError = deps.logError ?? (() => {});
    this.retentionMs = deps.finishedRetentionMs ?? FINISHED_RETENTION_MS;
  }

  hasGame(roomId: string): boolean {
    return this.games.has(roomId);
  }

  isPlayer(roomId: string, userId: string): boolean {
    return this.games.get(roomId)?.state.players.some((p) => p.id === userId) ?? false;
  }

  /** Host starts the match from the lobby. */
  start(roomId: string, userId: string): Promise<RealtimeError | null> {
    return this.guarded(roomId, async () => {
      if (this.games.has(roomId)) return realtimeError("GAME_ALREADY_STARTED");
      const room = await this.deps.repo.loadForStart(roomId);
      if (!room) return realtimeError("ROOM_NOT_FOUND");
      if (room.hostUserId !== userId) return realtimeError("NOT_HOST");
      if (room.status !== "WAITING") return realtimeError("GAME_ALREADY_STARTED");
      const count = room.players.length;
      if (count < MIN_PLAYERS || count > MAX_PLAYERS) return realtimeError("INVALID_PLAYER_COUNT");
      if (!(await this.deps.repo.claimForStart(roomId))) return realtimeError("GAME_ALREADY_STARTED");

      // Seats follow join order.
      const players = [...room.players].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const seed = this.randomSeed();
      const { state, events } = createGame({
        playerIds: players.map((p) => p.userId),
        settings: {
          discussionSeconds: room.discussionSeconds,
          enabledRoles: room.enabledRoles.filter((r): r is NamedRoleId =>
            (ALL_NAMED_ROLES as readonly string[]).includes(r)
          ),
        },
        now: this.now(),
        rng: createRng(seed),
      });

      const identities: Record<string, PlayerIdentity> = {};
      for (const p of players) {
        identities[p.userId] = p.isAnonymous
          ? { userId: null, guestId: p.userId }
          : { userId: p.userId, guestId: null };
      }

      await this.commit(
        {
          version: SNAPSHOT_VERSION,
          roomId,
          roomCode: room.code,
          seed,
          step: 0,
          startedAt: this.now(),
          identities,
          savedMatchId: null,
          state,
        },
        state,
        events
      );
      return null;
    });
  }

  /** A player action. Rejections go back to the caller only. */
  act(roomId: string, userId: string, action: ClientAction): Promise<RealtimeError | null> {
    return this.guarded(roomId, async () => {
      const game = this.games.get(roomId);
      if (!game) return realtimeError("NO_GAME");
      if (!game.state.players.some((p) => p.id === userId)) return realtimeError("NOT_IN_ROOM");

      const { state, events } = this.reduceStep(game, toEngineAction(action, userId));
      const rejected = events.find((e) => e.type === "ACTION_REJECTED");
      if (rejected?.type === "ACTION_REJECTED") return realtimeError(rejected.code);

      await this.commit(game, state, events);
      return null;
    });
  }

  /** Re-sends a player's view (after a reconnect or page reload). */
  sync(roomId: string, userId: string): Promise<RealtimeError | null> {
    return this.guarded(roomId, async () => {
      const game = this.games.get(roomId);
      if (!game) return realtimeError("NO_GAME");
      if (!game.state.players.some((p) => p.id === userId)) return realtimeError("NOT_IN_ROOM");
      this.deps.transport.sendView(roomId, userId, viewFor(game.state, userId));
      return null;
    });
  }

  /** Resumes every snapshotted match after a restart. */
  async restore(): Promise<number> {
    const snapshots = await this.deps.store.list();
    for (const snapshot of snapshots) {
      this.games.set(snapshot.roomId, snapshot);
      if (snapshot.state.phase === "POST_GAME") {
        await this.background(snapshot.roomId, () => this.finish(snapshot));
      } else {
        this.scheduleTick(snapshot);
      }
    }
    return snapshots.length;
  }

  /** Stops all timers (shutdown and tests). */
  stop(): void {
    this.deps.scheduler.cancelAll();
  }

  // --- internals ---------------------------------------------------------------

  /** Runs `task` after every earlier task for the same room has settled. */
  private serialize<T>(roomId: string, task: () => Promise<T>): Promise<T> {
    const run = (this.queues.get(roomId) ?? Promise.resolve()).then(task);
    const tail = run.then(
      () => undefined,
      () => undefined
    );
    this.queues.set(roomId, tail);
    void tail.then(() => {
      if (this.queues.get(roomId) === tail) this.queues.delete(roomId);
    });
    return run;
  }

  /** Serialized task whose unexpected failures become INTERNAL for the caller. */
  private guarded(
    roomId: string,
    task: () => Promise<RealtimeError | null>
  ): Promise<RealtimeError | null> {
    return this.serialize(roomId, task).catch((error: unknown) => {
      this.logError(error, `Game request failed for room ${roomId}`);
      return realtimeError("INTERNAL");
    });
  }

  /** Serialized background task (timers); failures are logged. */
  private background(roomId: string, task: () => Promise<void>): Promise<void> {
    return this.serialize(roomId, task).catch((error: unknown) => {
      this.logError(error, `Game background task failed for room ${roomId}`);
    });
  }

  /** Step n uses createRng(seed + n), so replays after a restart draw the same numbers. */
  private reduceStep(game: GameSnapshot, action: Action) {
    return reduce(game.state, action, this.now(), createRng(game.seed + game.step));
  }

  private tick(roomId: string): Promise<void> {
    return this.background(roomId, async () => {
      const game = this.games.get(roomId);
      if (!game) return;
      const { state, events } = this.reduceStep(game, { type: "TICK" });
      if (events.length === 0) {
        this.scheduleTick(game); // woke up early
        return;
      }
      await this.commit(game, state, events);
    });
  }

  private async commit(game: GameSnapshot, state: GameState, events: GameEvent[]): Promise<void> {
    const next: GameSnapshot = { ...game, state, step: game.step + 1 };
    this.games.set(next.roomId, next);
    await this.deps.store.save(next);
    this.broadcast(next, events);

    if (state.phase === "POST_GAME") {
      this.deps.scheduler.cancel(tickKey(next.roomId));
      await this.finish(next);
    } else {
      this.scheduleTick(next);
    }
  }

  private broadcast(game: GameSnapshot, events: GameEvent[]): void {
    this.deps.transport.sendEvents(game.roomId, publicEvents(events));
    for (const player of game.state.players) {
      this.deps.transport.sendView(game.roomId, player.id, viewFor(game.state, player.id));
    }
  }

  private scheduleTick(game: GameSnapshot): void {
    const { endsAt } = game.state;
    if (endsAt === null) return;
    this.deps.scheduler.schedule(tickKey(game.roomId), endsAt, () => {
      void this.tick(game.roomId);
    });
  }

  /** Saves the result once, closes the room and schedules the cleanup. */
  private async finish(game: GameSnapshot): Promise<void> {
    let current = game;
    if (!current.savedMatchId) {
      try {
        const { id } = await this.deps.repo.saveMatch(matchSummary(current.state), {
          roomCode: current.roomCode,
          startedAt: new Date(current.startedAt),
          endedAt: new Date(this.now()),
          identities: current.identities,
        });
        current = { ...current, savedMatchId: id };
        this.games.set(current.roomId, current);
        await this.deps.store.save(current);
      } catch (error) {
        // Keep the snapshot: a restart retries the save.
        this.logError(error, `Saving match for room ${current.roomId} failed`);
      }
      try {
        await this.deps.repo.markFinished(
          current.roomId,
          roundWins(current.state.roundResults, "GREEN"),
          roundWins(current.state.roundResults, "RED")
        );
      } catch (error) {
        this.logError(error, `Closing room ${current.roomId} failed`);
      }
    }

    this.deps.scheduler.schedule(disposeKey(current.roomId), this.now() + this.retentionMs, () => {
      void this.dispose(current.roomId);
    });
  }

  private dispose(roomId: string): Promise<void> {
    return this.background(roomId, async () => {
      this.games.delete(roomId);
      this.deps.scheduler.cancel(tickKey(roomId));
      await this.deps.store.delete(roomId);
    });
  }
}
