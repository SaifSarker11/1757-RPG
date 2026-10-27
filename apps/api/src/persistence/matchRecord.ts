import type { Prisma } from "@repo/db";
import type { MatchSummary, SummaryNomination } from "@repo/game-engine";

/** How an engine player id maps to a stored identity. Guests have no user row. */
export interface PlayerIdentity {
  userId: string | null;
  guestId: string | null;
}

export interface MatchContext {
  roomCode: string;
  startedAt: Date;
  endedAt: Date;
  /** Keyed by engine player id. Every player in the summary must be present. */
  identities: Readonly<Record<string, PlayerIdentity>>;
  /** Engine player ids that forfeited by staying disconnected past the grace period. */
  disconnectedForfeits?: readonly string[];
}

function roundRow(
  summary: MatchSummary,
  round: MatchSummary["rounds"][number]
): Prisma.MatchRoundCreateWithoutMatchInput {
  const attempts: SummaryNomination[] = summary.nominations.filter((n) => n.round === round.round);
  const approved = attempts.find((a) => a.approved);
  const lead = approved ?? attempts[attempts.length - 1];

  return {
    number: round.round,
    leaderSeat: lead?.leaderSeat ?? 0,
    teamSeats: approved?.ministerSeats ?? [],
    approved: approved !== undefined,
    successCount: round.successCount,
    sabotageCount: round.sabotageCount,
    result: round.winner,
    reason: round.reason,
    ballotVotes: {
      create: attempts.flatMap((a) =>
        a.votes.map((v) => ({ attempt: a.attempt, seat: v.seat, vote: v.vote, weight: v.weight }))
      ),
    },
  };
}

/**
 * Maps a finished match to one nested Prisma create. Prisma runs nested
 * writes in a single transaction, so the match is saved whole or not at all.
 */
export function buildMatchCreateInput(
  summary: MatchSummary,
  ctx: MatchContext
): Prisma.MatchCreateInput {
  const forfeits = new Set(ctx.disconnectedForfeits ?? []);

  return {
    roomCode: ctx.roomCode,
    playerCount: summary.playerCount,
    startedAt: ctx.startedAt,
    endedAt: ctx.endedAt,
    winner: summary.outcome.winner,
    reason: summary.outcome.reason,
    roundsGreen: summary.roundsGreen,
    roundsRed: summary.roundsRed,
    config: {
      discussionSeconds: summary.settings.discussionSeconds,
      enabledRoles: [...summary.settings.enabledRoles],
    },
    players: {
      create: summary.players.map((p) => {
        const identity = ctx.identities[p.playerId];
        if (!identity) throw new Error(`No identity for player ${p.playerId}`);
        const forfeited = forfeits.has(p.playerId);
        return {
          ...(identity.userId ? { user: { connect: { id: identity.userId } } } : {}),
          guestId: identity.guestId,
          seat: p.seat,
          role: p.role,
          team: p.team,
          // A forfeit always counts as a loss (§1).
          won: p.won && !forfeited,
          jeanLawLocked: p.jeanLawLocked,
          disconnectedForfeit: forfeited,
        };
      }),
    },
    rounds: {
      create: summary.rounds.map((r) => roundRow(summary, r)),
    },
  };
}
