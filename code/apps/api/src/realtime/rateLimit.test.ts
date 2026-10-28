import { describe, expect, it } from "vitest";
import { TokenBucket, createSocketLimiter } from "./rateLimit.js";

function clock(start = 0) {
  let now = start;
  return { now: () => now, advance: (ms: number) => (now += ms) };
}

describe("TokenBucket", () => {
  it("allows a burst up to capacity, then refuses", () => {
    const c = clock();
    const bucket = new TokenBucket(5, 5_000, c.now);
    const results = Array.from({ length: 6 }, () => bucket.tryTake());
    expect(results).toEqual([true, true, true, true, true, false]);
  });

  it("refills over time", () => {
    const c = clock();
    const bucket = new TokenBucket(5, 5_000, c.now);
    for (let i = 0; i < 5; i++) bucket.tryTake();
    c.advance(999);
    expect(bucket.tryTake()).toBe(false);
    c.advance(1);
    expect(bucket.tryTake()).toBe(true); // 1 s refills 1 of 5
  });

  it("never stores more than its capacity", () => {
    const c = clock();
    const bucket = new TokenBucket(3, 1_000, c.now);
    c.advance(60_000);
    const results = Array.from({ length: 4 }, () => bucket.tryTake());
    expect(results).toEqual([true, true, true, false]);
  });
});

describe("createSocketLimiter", () => {
  it("limits chat to 5 per 5 s and actions to 10 per s, independently", () => {
    const c = clock();
    const allow = createSocketLimiter(c.now);
    const chat = Array.from({ length: 6 }, () => allow("chat"));
    const actions = Array.from({ length: 11 }, () => allow("action"));
    expect(chat.filter(Boolean)).toHaveLength(5);
    expect(actions.filter(Boolean)).toHaveLength(10);
    c.advance(1_000);
    expect(allow("action")).toBe(true);
    expect(allow("chat")).toBe(true);
  });
});
