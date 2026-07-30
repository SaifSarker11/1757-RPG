export const TOTAL_ROUNDS = 5;
export const MAX_REJECTIONS = 3;
export const ROUNDS_TO_WIN = 3;
export const DISCUSSION_DURATION_MS = 120000;

/**
 * Returns the expected size of the proposed minister board/team 
 * for a specific round, scaled to the player count.
 */
export function getTeamSizeForRound(roundNumber: number, playerCount: number): number {
  const sizes: Record<number, number[]> = {
    6:  [2, 3, 4, 3, 4],
    7:  [2, 3, 3, 4, 4],
    8:  [3, 4, 4, 5, 5],
    9:  [3, 4, 4, 5, 5],
    10: [3, 4, 4, 5, 5],
    11: [3, 4, 5, 5, 6],
    12: [4, 5, 5, 6, 6],
    13: [4, 5, 6, 6, 7],
    14: [4, 6, 6, 7, 7],
    15: [5, 6, 7, 7, 8]
  };
  const roundIndex = roundNumber - 1;
  const playerSizes = sizes[playerCount] ?? sizes[6];
  return playerSizes[roundIndex] ?? 3;
}
