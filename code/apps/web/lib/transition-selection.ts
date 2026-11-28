/** Browser-independent shuffle-bag rules; every scene appears once per cycle. */
export interface SceneCycle { remaining: string[]; last: string | null }
export function selectScene(ids: readonly string[], cycle: SceneCycle, random: () => number = Math.random): { id: string | null; cycle: SceneCycle } {
  if (!ids.length) return { id: null, cycle: { remaining: [], last: null } };
  let remaining = [...new Set(cycle.remaining.filter(id => ids.includes(id) && id !== cycle.last))];
  if (!remaining.length) {
    remaining = [...ids];
    for (let i = remaining.length - 1; i > 0; i--) {
      const draw = random();
      const j = Math.min(i, Math.max(0, Math.floor((Number.isFinite(draw) ? draw : 0) * (i + 1))));
      const a = remaining[i]; const b = remaining[j];
      if (a !== undefined && b !== undefined) { remaining[i] = b; remaining[j] = a; }
    }
    if (remaining.length > 1 && remaining[remaining.length - 1] === cycle.last) {
      const first = remaining[0]; const last = remaining[remaining.length - 1];
      if (first !== undefined && last !== undefined) { remaining[0] = last; remaining[remaining.length - 1] = first; }
    }
  }
  const id = remaining.pop() ?? null;
  return { id, cycle: { remaining, last: id } };
}

export function readSceneCycle(raw: string | null): SceneCycle {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (!value || typeof value !== "object") return { remaining: [], last: null };
    const record = value as Record<string, unknown>;
    return {
      remaining: Array.isArray(record['remaining']) ? record['remaining'].filter((id): id is string => typeof id === 'string') : [],
      last: typeof record['last'] === 'string' ? record['last'] : null,
    };
  } catch { return { remaining: [], last: null }; }
}