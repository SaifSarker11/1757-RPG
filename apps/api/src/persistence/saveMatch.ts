import type { db } from "@repo/db";
import type { MatchSummary } from "@repo/game-engine";
import { buildMatchCreateInput, type MatchContext } from "./matchRecord.js";

type MatchClient = Pick<typeof db, "match">;

/**
 * Saves a finished match. This is the only Postgres write for a match:
 * live play never touches the database (§6).
 */
export async function saveMatch(
  client: MatchClient,
  summary: MatchSummary,
  ctx: MatchContext
): Promise<{ id: string }> {
  return client.match.create({
    data: buildMatchCreateInput(summary, ctx),
    select: { id: true },
  });
}
