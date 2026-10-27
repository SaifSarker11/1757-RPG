import { describe, expect, it } from "vitest";
import {
  COMPOSITION,
  MAX_PLAYERS,
  MIN_PLAYERS,
  getComposition,
  getSabotagesToFail,
  getTeamSize,
} from "../src/config/gameConfig.js";

describe("COMPOSITION", () => {
  it("covers every player count from 6 to 15", () => {
    for (let n = MIN_PLAYERS; n <= MAX_PLAYERS; n++) {
      expect(COMPOSITION[n]).toBeDefined();
    }
  });

  it("team counts add up to the player count", () => {
    for (let n = MIN_PLAYERS; n <= MAX_PLAYERS; n++) {
      const c = getComposition(n);
      expect(c.green + c.red + c.gold).toBe(n);
    }
  });

  it("never asks for more ministers than players", () => {
    for (let n = MIN_PLAYERS; n <= MAX_PLAYERS; n++) {
      for (const size of getComposition(n).teamSizes) {
        expect(size).toBeLessThanOrEqual(n);
      }
    }
  });

  it("15 players is the full named cast: 7 Green, 7 Red, 1 Gold", () => {
    expect(getComposition(15)).toMatchObject({ green: 7, red: 7, gold: 1 });
  });

  it("rejects counts outside 6-15", () => {
    expect(() => getComposition(5)).toThrow(RangeError);
    expect(() => getComposition(16)).toThrow(RangeError);
  });
});

describe("getTeamSize", () => {
  it("reads the §4.3 table", () => {
    expect(getTeamSize(6, 1)).toBe(2);
    expect(getTeamSize(6, 3)).toBe(4);
    expect(getTeamSize(15, 5)).toBe(7);
  });

  it("rejects rounds outside 1-5", () => {
    expect(() => getTeamSize(6, 0)).toThrow(RangeError);
    expect(() => getTeamSize(6, 6)).toThrow(RangeError);
  });
});

describe("getSabotagesToFail", () => {
  it("needs 1 sabotage outside Round 4", () => {
    for (const round of [1, 2, 3, 5]) {
      expect(getSabotagesToFail(10, round)).toBe(1);
    }
  });

  it("needs 2 in Round 4 from 7 players, 1 at 6 players", () => {
    expect(getSabotagesToFail(6, 4)).toBe(1);
    expect(getSabotagesToFail(7, 4)).toBe(2);
    expect(getSabotagesToFail(15, 4)).toBe(2);
  });
});
