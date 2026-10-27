import type { db } from "@repo/db";
import type { MatchSummary } from "@repo/game-engine";
import { applyMatchXp, computeMatchXp } from "../users/xp.js";
import { buildMatchCreateInput, type MatchContext } from "./matchRecord.js";

type MatchClient = typeof db;

/**
 * Saves a finished match and awards XP to participating registered players.
 * This is the only Postgres write for a match: live play never touches the database (§6).
 */
export async function saveMatch(
  client: MatchClient,
  summary: MatchSummary,
  ctx: MatchContext
): Promise<{ id: string }> {
  const match = await client.match.create({
    data: buildMatchCreateInput(summary, ctx),
    select: { id: true },
  });

  // M8: Award XP and recalculate levels for non-guest players
  const forfeits = new Set(ctx.disconnectedForfeits ?? []);
  for (const player of summary.players) {
    const identity = ctx.identities[player.id];
    if (!identity?.userId) continue;

    const won = summary.playerResults[player.id]?.won ?? false;
    const jeanLawLocked = summary.playerResults[player.id]?.jeanLawLocked ?? false;
    const isForfeit = forfeits.has(player.id);

    const xpGained = computeMatchXp({
      won,
      jeanLawLocked,
      disconnectedForfeit: isForfeit,
    });

    if (xpGained > 0) {
      try {
        const user = await client.user.findUnique({
          where: { id: identity.userId },
          select: { xp: true },
        });
        if (user) {
          const { newXp, newLevel } = applyMatchXp(user.xp, xpGained);
          await client.user.update({
            where: { id: identity.userId },
            data: { xp: newXp, level: newLevel },
          });
        }
      } catch {
        // Non-critical: fail gracefully without rolling back match record
      }
    }
  }

  return match;
}
