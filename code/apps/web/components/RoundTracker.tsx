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
    <div className="council-panel rounded-2xl p-4 md:p-5 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/10 pb-3 gap-2">
        <div>
          <span className="text-[10px] font-mono-code uppercase tracking-[0.2em] text-[#9E9587]">
            Campaign Progress
          </span>
          <h3 className="font-display text-xl font-semibold text-[#F2ECE1]">
            Round {round} of 5{" "}
            <span className="text-sm font-sans font-normal text-[#9E9587]">
              · Attempt {attempt}/5
            </span>
          </h3>
        </div>

        {/* Fail track (5 consecutive rejections = round awarded to Red) */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono-code uppercase tracking-wider text-red-400/90 mr-1">
            Fail Track
          </span>
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`w-6 h-6 rounded-md flex items-center justify-center border font-mono-code text-xs transition-all ${
                step <= failTrack
                  ? "bg-red-900/70 text-red-200 border-red-500/60 font-semibold shadow-sm shadow-red-950"
                  : "bg-white/[0.03] border-white/10 text-[#9E9587]/50"
              }`}
            >
              {step}
            </div>
          ))}
        </div>
      </div>

      {/* Rounds 1 to 5 status chips */}
      <div className="grid grid-cols-5 gap-2.5">
        {totalRounds.map((rNum) => {
          const res = roundResults.find((r) => r.round === rNum);
          const isCurrent = round === rNum;

          let style = "bg-white/[0.02] border-white/10 text-[#9E9587]/60";
          let label = `R${rNum}`;

          if (res) {
            if (res.winner === "GREEN") {
              style = "bg-emerald-950/60 border-emerald-500/50 text-emerald-300 font-semibold";
              label = `R${rNum} · Won`;
            } else {
              style = "bg-red-950/60 border-red-500/50 text-red-300 font-semibold";
              label = `R${rNum} · Lost`;
            }
          } else if (isCurrent) {
            style = "border-[#C8A252]/70 bg-[#C8A252]/15 text-[#C8A252] font-semibold shadow-[0_0_16px_-4px_rgba(200,162,82,0.35)]";
          }

          return (
            <div
              key={rNum}
              className={`py-2.5 px-2 rounded-xl border text-center text-xs flex flex-col items-center justify-center transition-all ${style}`}
            >
              <span className="font-mono-code tracking-wider">{label}</span>
              {res && (
                <span className="text-[10px] font-mono-code uppercase opacity-80 mt-0.5">
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
