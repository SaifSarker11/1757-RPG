import { describe, expect, it } from "vitest";
import { createRng, randomInt, shuffle } from "../src/rng.js";

describe("createRng", () => {
  it("is deterministic for the same seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("differs between seeds", () => {
    expect(createRng(1)()).not.toBe(createRng(2)());
  });

  it("stays in [0, 1)", () => {
    const rng = createRng(7);
    for (let i = 0; i < 10_000; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("randomInt", () => {
  it("stays below the bound", () => {
    const rng = createRng(3);
    for (let i = 0; i < 1000; i++) {
      expect(randomInt(rng, 6)).toBeLessThan(6);
    }
  });
});

describe("shuffle", () => {
  it("keeps every item and does not mutate the input", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const output = shuffle(input, createRng(9));
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect([...output].sort((x, y) => x - y)).toEqual(input);
  });
});
