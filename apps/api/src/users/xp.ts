/**
 * XP & Level progression rules for 1757 RPG.
 * - Base XP for completing a match: 50 XP
 * - Bonus XP for winning: 100 XP
 * - Bonus XP for Jean Law lock: 25 XP
 * - XP required per level: 200 * currentLevel
 */

export const XP_CONFIG = {
  MATCH_COMPLETION: 50,
  MATCH_WIN: 100,
  JEAN_LAW_LOCK: 25,
  BASE_LEVEL_XP: 200,
} as const;

export interface XpCalculationResult {
  xpGained: number;
  newXp: number;
  newLevel: number;
  leveledUp: boolean;
}

export function calculateLevel(totalXp: number): number {
  if (totalXp <= 0) return 1;
  // level = floor(sqrt(totalXp / 100)) + 1 or linear scaling
  // Linear scale: Level L requires (L - 1) * 200 cumulative XP
  let level = 1;
  let neededForNext = level * XP_CONFIG.BASE_LEVEL_XP;
  let remaining = totalXp;

  while (remaining >= neededForNext) {
    remaining -= neededForNext;
    level += 1;
    neededForNext = level * XP_CONFIG.BASE_LEVEL_XP;
  }
  return level;
}

export function computeMatchXp(params: {
  won: boolean;
  jeanLawLocked?: boolean;
  disconnectedForfeit?: boolean;
}): number {
  if (params.disconnectedForfeit) {
    return 0; // No XP for forfeits
  }
  let xp = XP_CONFIG.MATCH_COMPLETION;
  if (params.won) {
    xp += XP_CONFIG.MATCH_WIN;
  }
  if (params.jeanLawLocked) {
    xp += XP_CONFIG.JEAN_LAW_LOCK;
  }
  return xp;
}

export function applyMatchXp(currentXp: number, xpGained: number): XpCalculationResult {
  const previousLevel = calculateLevel(currentXp);
  const newXp = currentXp + xpGained;
  const newLevel = calculateLevel(newXp);
  return {
    xpGained,
    newXp,
    newLevel,
    leveledUp: newLevel > previousLevel,
  };
}
