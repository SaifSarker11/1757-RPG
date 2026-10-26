import { ballotWeight, getTeamSize } from "../config/gameConfig.js";
import { allowedCardsFor } from "../phases/mission.js";
import { lastBallotResultsCard } from "../phases/resultsCard.js";
import type { GameState, PlayerState } from "../types.js";
import type { PendingActions, PlayerView, PublicView } from "./types.js";
import { computeReveals, computeVision } from "./visionRules.js";

/** The part of the game every player may see. Roles appear only in POST_GAME. */
export function publicView(state: GameState): PublicView {
  const revealRoles = state.phase === "POST_GAME";
  return {
    phase: state.phase,
    round: state.round,
    attempt: state.attempt,
    endsAt: state.endsAt,
    leaderSeat: state.leaderSeat,
    failTrack: state.failTrack,
    teamSize: getTeamSize(state.players.length, state.round),
    players: state.players.map((p) =>
      revealRoles ? { id: p.id, seat: p.seat, role: p.role, team: p.team } : { id: p.id, seat: p.seat }
    ),
    ministerIds: [...state.ministerIds],
    votedIds: state.players.filter((p) => state.votes[p.id] !== undefined).map((p) => p.id),
    playedIds: state.ministerIds.filter((id) => state.cards[id] !== undefined),
    nominations: structuredClone(state.nominations),
    lastBallot: lastBallotResultsCard(state),
    roundResults: structuredClone(state.roundResults),
    outcome: state.outcome ? { ...state.outcome } : null,
  };
}

function pendingActions(state: GameState, me: PlayerState): PendingActions {
  const inDiscussion = state.phase === "DISCUSSION";
  const playCard =
    state.phase === "RESOLUTION" &&
    state.ministerIds.includes(me.id) &&
    state.cards[me.id] === undefined;
  return {
    nominate:
      state.phase === "SELECTION" && me.seat === state.leaderSeat
        ? { teamSize: getTeamSize(state.players.length, state.round) }
        : null,
    vote: state.phase === "BALLOT" && state.votes[me.id] === undefined,
    playCard,
    allowedCards: playCard ? [...allowedCardsFor(me)] : [],
    deBussyReveal: inDiscussion && me.role === "DE_BUSSY" && state.abilities.deBussy === null,
    jeanLawLock: inDiscussion && me.role === "JEAN_LAW" && state.abilities.jeanLaw === null,
  };
}

/**
 * Everything `playerId` is allowed to know (§5). This is the only thing the
 * server may send to a player; never send `GameState` itself.
 */
export function viewFor(state: GameState, playerId: string): PlayerView {
  const me = state.players.find((p) => p.id === playerId);
  if (!me) throw new Error(`Player ${playerId} is not in this game`);

  return {
    me: { ...me },
    vision: computeVision(state, me),
    reveals: computeReveals(state, me),
    jeanLawTargetId: me.role === "JEAN_LAW" ? (state.abilities.jeanLaw?.targetId ?? null) : null,
    myVote: state.votes[me.id] ?? null,
    myVoteWeight: ballotWeight(me.role),
    myCard: state.cards[me.id] ?? null,
    pending: pendingActions(state, me),
    game: publicView(state),
  };
}
