import React from "react";
import type { PlayerView } from "@/lib/game-types";

interface RoundTrackerProps {
  view: PlayerView;
}

export function RoundTracker({ view }: RoundTrackerProps) {
  const { game } = view;
  const { round, attempt, failTrack, roundResults } = game;

  const totalRounds = [1, 2, 3, 4, 5];

  return (
    <div className="bg-base-100 border-4 border-base-content/20 p-4 pixel-card flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-base-300 pb-2 gap-2">
        <div>
          <span className="text-xs uppercase font-pixel tracking-wide text-base-content/70">
            ROUND PROGRESS
          </span>
          <h3 className="text-lg font-historical font-bold text-primary">
            Round {round} of 5 (Attempt {attempt}/5)
          </h3>
        </div>

        {/* Fail track (5 consecutive rejections = round awarded to Red) */}
        <div className="flex items-center gap-1 font-pixel text-xs">
          <span className="text-error font-bold mr-1">FAIL TRACK:</span>
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`w-5 h-5 flex items-center justify-center border font-mono text-xs ${
                step <= failTrack
                  ? "bg-error text-error-content border-error font-bold"
                  : "bg-base-200 border-base-300 text-base-content/40"
              }`}
            >
              {step}
            </div>
          ))}
        </div>
      </div>

      {/* Rounds 1 to 5 status chips */}
      <div className="grid grid-cols-5 gap-2">
        {totalRounds.map((rNum) => {
          const res = roundResults.find((r) => r.round === rNum);
          const isCurrent = round === rNum;

          let bg = "bg-base-200 border-base-300 text-base-content/50";
          let label = `R${rNum}`;

          if (res) {
            if (res.winner === "GREEN") {
              bg = "bg-success text-success-content border-success font-bold";
              label = `R${rNum} ✓`;
            } else {
              bg = "bg-error text-error-content border-error font-bold";
              label = `R${rNum} ✗`;
            }
          } else if (isCurrent) {
            bg = "border-primary bg-primary/20 text-primary font-bold animate-pulse";
          }

          return (
            <div
              key={rNum}
              className={`p-2 border-2 text-center font-pixel text-xs flex flex-col items-center justify-center rounded-none ${bg}`}
            >
              <span>{label}</span>
              {res && (
                <span className="text-[10px] font-mono mt-0.5">
                  {res.winner}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
