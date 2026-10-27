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
      <div className={`font-pixel font-bold px-3 py-1 border-2 inline-flex items-center gap-2 bg-info text-info-content border-info ${className}`}>
        <span className="text-xs uppercase tracking-wider">PAUSED:</span>
        <span className="text-sm font-mono">{Math.ceil(pausedRemainingMs / 1000)}s</span>
      </div>
    );
  }

  if (!endsAt) return null;

  const isUrgent = secondsRemaining <= 10 && secondsRemaining > 0;

  return (
    <div
      className={`font-pixel font-bold px-3 py-1 border-2 inline-flex items-center gap-2 ${
        isUrgent
          ? "bg-error text-error-content border-error animate-pulse"
          : "bg-base-200 text-base-content border-base-300"
      } ${className}`}
    >
      <span className="text-xs uppercase tracking-wider">DEADLINE:</span>
      <span className="text-sm font-mono">{secondsRemaining}s</span>
    </div>
  );
}
