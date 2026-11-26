import React from "react";
import type { PublicNomination, PublicPlayer } from "@/lib/game-types";

interface NominationHistoryCardProps {
  nominations: PublicNomination[];
  players?: PublicPlayer[];
  playerNames?: Record<string, string>;
}

export function NominationHistoryCard({
  nominations,
  players = [],
  playerNames = {},
}: NominationHistoryCardProps) {
  const seatOf = new Map(players.map((p) => [p.id, p.seat]));
  const label = (id: string) => {
    const seat = seatOf.get(id);
    const name = playerNames[id];
    if (seat === undefined) return name ?? "?";
    return name ? `#${seat + 1} ${name}` : `#${seat + 1}`;
  };

  if (nominations.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-[#9E9587] text-center">
        No nominations deliberated yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 max-h-64 overflow-y-auto pr-1">
      {nominations.map((nom, idx) => {
        const approvedStyle = nom.approved
          ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
          : "bg-red-950/60 text-red-300 border-red-500/40";

        return (
          <div
            key={idx}
            className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs flex flex-col gap-1.5"
          >
            <div className="flex justify-between items-center">
              <span className="font-mono-code font-semibold text-[#F2ECE1]">
                R{nom.round} · Attempt #{nom.attempt}
              </span>
              <span className={`px-2 py-0.5 rounded-md border text-[10px] font-mono-code uppercase ${approvedStyle}`}>
                {nom.approved ? "Approved" : "Rejected"}
              </span>
            </div>

            <div className="text-[11px] text-[#9E9587]">
              <span className="text-[#C8A252] font-medium mr-1.5">Leader:</span>
              Seat #{nom.leaderSeat + 1}
            </div>

            <div className="text-[11px] text-[#9E9587]">
              <span className="text-[#F2ECE1]/80 font-medium mr-1.5">Ministers:</span>
              {nom.ministerIds ? nom.ministerIds.map(label).join(", ") : "None (leader timed out)"}
            </div>

            {/* Votes breakdown */}
            <div className="flex flex-wrap gap-1.5 mt-1 pt-1.5 border-t border-white/5">
              {Object.entries(nom.votes).map(([playerId, vote]) => (
                <span
                  key={playerId}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono-code border ${
                    vote === "APPROVE"
                      ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-300"
                      : "border-red-500/30 bg-red-950/40 text-red-300"
                  }`}
                >
                  {label(playerId)}: {vote === "APPROVE" ? "YEAH" : "NAY"}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
