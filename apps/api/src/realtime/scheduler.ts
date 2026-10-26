/** One pending timer per key; scheduling a key again replaces its timer. */
export interface Scheduler {
  schedule(key: string, at: number, run: () => void): void;
  cancel(key: string): void;
  cancelAll(): void;
}

export interface TimerApi {
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

const realTimers: TimerApi = {
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export function createTimerScheduler(
  now: () => number = Date.now,
  timers: TimerApi = realTimers
): Scheduler {
  const pending = new Map<string, unknown>();

  const cancel = (key: string) => {
    const handle = pending.get(key);
    if (handle !== undefined) timers.clearTimeout(handle);
    pending.delete(key);
  };

  return {
    schedule(key, at, run) {
      cancel(key);
      const handle = timers.setTimeout(() => {
        pending.delete(key);
        run();
      }, Math.max(0, at - now()));
      pending.set(key, handle);
    },
    cancel,
    cancelAll() {
      for (const key of [...pending.keys()]) cancel(key);
    },
  };
}
