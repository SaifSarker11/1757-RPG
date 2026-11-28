import { describe, expect, it } from "vitest";
import { readSceneCycle, selectScene, type SceneCycle } from "../../../apps/web/lib/transition-selection";

import { TRANSITION_SCENES } from "../../../apps/web/lib/transition-scenes";

const ids = Array.from({ length: 18 }, (_, i) => `scene-${i}`);
describe("stochastic transition cycles", () => {
  it("includes all three requested historical scenes within an eighteen-scene gallery", () => {
    expect(TRANSITION_SCENES).toHaveLength(18);
    expect(TRANSITION_SCENES.map(scene => scene.id)).toEqual(expect.arrayContaining(["company-bengal-conspiracy", "bengal-defeat", "warship-conspiracy"]));
  });
  it("shows 18 distinct scenes before any scene repeats", () => {
    let cycle: SceneCycle = { remaining: [], last: null };
    const seen: Array<string | null> = [];
    for (let i = 0; i < 18; i++) { const pick = selectScene(ids, cycle, () => .42); seen.push(pick.id); cycle = pick.cycle; }
    expect(new Set(seen).size).toBe(18);
    expect(cycle.remaining).toHaveLength(0);
  });
  it("never repeats the previous scene at a cycle boundary", () => {
    const pick = selectScene(ids, { remaining: [], last: 'scene-14' }, () => .999);
    expect(pick.id).not.toBe('scene-14');
  });
  it("uses random draws rather than a fixed sequence", () => {
    expect(selectScene(ids, { remaining: [], last: null }, () => 0).id)
      .not.toBe(selectScene(ids, { remaining: [], last: null }, () => .999).id);
  });
  it("continues a saved cycle across page reloads", () => {
    const first = selectScene(ids, { remaining: [], last: null }, () => .5);
    const next = selectScene(ids, readSceneCycle(JSON.stringify(first.cycle)), () => .5);
    expect(next.cycle.remaining).toHaveLength(16);
    expect(next.id).not.toBe(first.id);
  });
  it("recovers from malformed or retired scene IDs", () => {
    expect(readSceneCycle('{')).toEqual({ remaining: [], last: null });
    expect(ids).toContain(selectScene(ids, { remaining: ['retired'], last: null }, () => .5).id);
  });
});