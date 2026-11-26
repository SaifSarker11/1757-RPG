import React, { useEffect, useState } from "react";

interface CountdownTimerProps {
  endsAt: number | null;
  /** Set while the host has paused: the frozen time left, shown without counting down. */
  pausedRemainingMs?: number | null;
  onExpire?: () => void;
  className?: string;
}

export function CountdownTimer({ endsAt, pausedRemainingMs = null, onExpire, className = "" }: CountdownTimerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  useEffect(() => {
    if (!endsAt) {
      setSecondsRemaining(0);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diffMs = endsAt - now;
      const secs = Math.max(0, Math.ceil(diffMs / 1000));
      setSecondsRemaining(secs);

      if (secs === 0 && onExpire) {
        onExpire();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endsAt, onExpire]);

  if (pausedRemainingMs !== null) {
    return (
      <div
        className={`px-3.5 py-1.5 rounded-xl border border-sky-500/40 bg-sky-950/40 text-sky-200 inline-flex items-center gap-2 ${className}`}
      >
        <span className="text-[10px] font-mono-code uppercase tracking-widest">Paused</span>
        <span className="text-sm font-mono-code font-semibold">{Math.ceil(pausedRemainingMs / 1000)}s</span>
      </div>
    );
  }

  if (!endsAt) return null;

  const isUrgent = secondsRemaining <= 10 && secondsRemaining > 0;

  return (
    <div
      className={`px-3.5 py-1.5 rounded-xl border inline-flex items-center gap-2 transition-colors ${
        isUrgent
          ? "border-red-500/60 bg-red-950/60 text-red-200 animate-pulse"
          : "border-[#C8A252]/30 bg-[#161410] text-[#F2ECE1]"
      } ${className}`}
    >
      <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#9E9587]">Deadline</span>
      <span className={`text-sm font-mono-code font-semibold ${isUrgent ? "text-red-300" : "text-[#C8A252]"}`}>
        {secondsRemaining}s
      </span>
    </div>
  );
}
