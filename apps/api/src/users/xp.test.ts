import { describe, expect, it } from "vitest";
import { applyMatchXp, calculateLevel, computeMatchXp, XP_CONFIG } from "./xp.js";

describe("XP progression rules", () => {
  it("calculates level 1 for 0 XP", () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(-50)).toBe(1);
  });

  it("calculates level progression as XP increases", () => {
    // Level 1: 0 - 199 XP
    expect(calculateLevel(100)).toBe(1);
    expect(calculateLevel(199)).toBe(1);
    // Level 2: 200 XP (level 1 needed 200, next needs 400)
    expect(calculateLevel(200)).toBe(2);
    expect(calculateLevel(599)).toBe(2);
    // Level 3: 200 + 400 = 600 XP
    expect(calculateLevel(600)).toBe(3);
  });

  it("computes match XP correctly", () => {
    // Loss without forfeit
    expect(computeMatchXp({ won: false })).toBe(XP_CONFIG.MATCH_COMPLETION);
    // Win
    expect(computeMatchXp({ won: true })).toBe(XP_CONFIG.MATCH_COMPLETION + XP_CONFIG.MATCH_WIN);
    // Win with Jean Law lock
    expect(computeMatchXp({ won: true, jeanLawLocked: true })).toBe(
      XP_CONFIG.MATCH_COMPLETION + XP_CONFIG.MATCH_WIN + XP_CONFIG.JEAN_LAW_LOCK
    );
    // Disconnected forfeit yields 0 XP
    expect(computeMatchXp({ won: true, disconnectedForfeit: true })).toBe(0);
  });

  it("applies match XP and detects level-up", () => {
    const res = applyMatchXp(150, 100);
    expect(res.newXp).toBe(250);
    expect(res.newLevel).toBe(2);
    expect(res.leveledUp).toBe(true);

    const resNoLevelUp = applyMatchXp(50, 50);
    expect(resNoLevelUp.newXp).toBe(100);
    expect(resNoLevelUp.newLevel).toBe(1);
    expect(resNoLevelUp.leveledUp).toBe(false);
  });
});
