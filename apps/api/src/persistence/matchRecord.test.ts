import { describe, expect, it, vi } from "vitest";
import {
  createGame,
  createRng,
  getTeamSize,
  matchSummary,
  reduce,
  type GameState,
  type MatchSummary,
} from "@repo/game-engine";
import { buildMatchCreateInput, type MatchContext } from "./matchRecord.js";
import { saveMatch } from "./saveMatch.js";

const IDS = ["u1", "u2", "u3", "g1", "g2", "u4"];

/**
 * Plays a match to POST_GAME using only the public engine API. Every Leader
 * nominates the first seats; `deadlockRounds` rounds are instead lost by
 * five selection timeouts. All guesses time out.
 */
function playMatch(deadlockRounds = 0): GameState {
  const rng = createRng(7);
  let now = 0;
  let { state } = createGame({ playerIds: IDS, now, rng, settings: { discussionSeconds: 30 } });

  for (let guard = 0; state.phase !== "POST_GAME"; guard++) {
    if (guard > 1000) throw new Error("match never ended");
    if (state.phase === "SELECTION" && state.round > deadlockRounds) {
      const leader = state.players.find((p) => p.seat === state.leaderSeat);
      const ministerIds = state.players.slice(0, getTeamSize(IDS.length, state.round)).map((p) => p.id);
      state = reduce(state, { type: "NOMINATE", playerId: leader?.id ?? "", ministerIds }, now, rng).state;
    } else {
      now = state.endsAt ?? now;
      state = reduce(state, { type: "TICK" }, now, rng).state;
    }
  }
  return state;
}

const context: MatchContext = {
  roomCode: "ABC123",
  startedAt: new Date("2026-10-26T10:00:00Z"),
  endedAt: new Date("2026-10-26T10:30:00Z"),
  identities: {
    u1: { userId: "user-1", guestId: null },
    u2: { userId: "user-2", guestId: null },
    u3: { userId: "user-3", guestId: null },
    g1: { userId: null, guestId: "guest-1" },
    g2: { userId: null, guestId: "guest-2" },
    u4: { userId: "user-4", guestId: null },
  },
};

describe("buildMatchCreateInput", () => {
  const summary: MatchSummary = matchSummary(playMatch());
  const input = buildMatchCreateInput(summary, context);

  it("copies the match totals and settings", () => {
    expect(input).toMatchObject({
      roomCode: "ABC123",
      playerCount: 6,
      winner: summary.outcome.winner,
      reason: summary.outcome.reason,
      roundsGreen: summary.roundsGreen,
      roundsRed: summary.roundsRed,
      config: { discussionSeconds: 30 },
    });
    expect(input.startedAt).toEqual(context.startedAt);
  });

  it("connects registered users and stores guests by guest id only", () => {
    const players = input.players?.create;
    if (!Array.isArray(players)) throw new Error("expected a create array");
    expect(players).toHaveLength(6);
    expect(players[0]).toMatchObject({ seat: 0, user: { connect: { id: "user-1" } }, guestId: null });
    expect(players[3]).toMatchObject({ seat: 3, guestId: "guest-1" });
    expect(players[3]).not.toHaveProperty("user");
  });

  it("copies roles, teams and win credit", () => {
    const players = input.players?.create;
    if (!Array.isArray(players)) throw new Error("expected a create array");
    for (const [i, p] of players.entries()) {
      const result = summary.players[i];
      expect(p).toMatchObject({ role: result?.role, team: result?.team, won: result?.won });
    }
  });

  it("stores one round per result with its approved team and every ballot vote", () => {
    const rounds = input.rounds?.create;
    if (!Array.isArray(rounds)) throw new Error("expected a create array");
    expect(rounds).toHaveLength(summary.rounds.length);
    const first = rounds[0];
    expect(first).toMatchObject({ number: 1, approved: true, teamSeats: [0, 1], reason: "MISSION" });
    const votes = first?.ballotVotes?.create;
    expect(Array.isArray(votes) ? votes : []).toHaveLength(6);
  });

  it("throws when a player has no identity", () => {
    const { u1: _dropped, ...rest } = context.identities;
    expect(() => buildMatchCreateInput(summary, { ...context, identities: rest })).toThrow(/u1/);
  });

  it("records a forfeit as a loss", () => {
    const winner = summary.players.find((p) => p.won);
    if (!winner) throw new Error("someone should have won");
    const withForfeit = buildMatchCreateInput(summary, {
      ...context,
      disconnectedForfeits: [winner.playerId],
    });
    const players = withForfeit.players?.create;
    if (!Array.isArray(players)) throw new Error("expected a create array");
    expect(players[winner.seat]).toMatchObject({ won: false, disconnectedForfeit: true });
  });
});

describe("deadlocked rounds", () => {
  it("are stored as unapproved Red rounds with no team", () => {
    const summary = matchSummary(playMatch(1));
    const rounds = buildMatchCreateInput(summary, context).rounds?.create;
    if (!Array.isArray(rounds)) throw new Error("expected a create array");
    expect(rounds[0]).toMatchObject({
      number: 1,
      approved: false,
      teamSeats: [],
      result: "RED",
      reason: "DEADLOCK",
    });
    // Five timed-out nominations, none of which reached a ballot.
    expect(rounds[0]?.ballotVotes?.create).toEqual([]);
  });
});

describe("saveMatch", () => {
  it("writes the whole match in one create and returns its id", async () => {
    const create = vi.fn().mockResolvedValue({ id: "match-1" });
    const summary = matchSummary(playMatch());
    const client = { match: { create } } as unknown as Parameters<typeof saveMatch>[0];

    await expect(saveMatch(client, summary, context)).resolves.toEqual({ id: "match-1" });
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      data: buildMatchCreateInput(summary, context),
      select: { id: true },
    });
  });
});
