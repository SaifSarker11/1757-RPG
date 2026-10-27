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
      <div className="p-3 bg-base-200 border-2 border-base-300 font-pixel text-xs text-base-content/60 text-center">
        No nominations deliberated yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
      {nominations.map((nom, idx) => {
        const approvedBadge = nom.approved
          ? "badge-success text-success-content"
          : "badge-error text-error-content";

        return (
          <div
            key={idx}
            className="p-2.5 bg-base-100 border-2 border-base-300 font-pixel text-xs flex flex-col gap-1"
          >
            <div className="flex justify-between items-center">
              <span className="font-bold">
                Round {nom.round} — Attempt #{nom.attempt}
              </span>
              <span className={`badge badge-sm rounded-none text-[10px] ${approvedBadge}`}>
                {nom.approved ? "APPROVED" : "REJECTED"}
              </span>
            </div>

            <div className="text-[10px] text-base-content/75 font-sans">
              <span className="font-pixel font-bold text-primary mr-1">Leader Seat:</span>
              #{nom.leaderSeat + 1}
            </div>

            <div className="text-[10px] text-base-content/75 font-sans">
              <span className="font-pixel font-bold text-accent mr-1">Ministers:</span>
              {nom.ministerIds ? nom.ministerIds.map(label).join(", ") : "None (leader timed out)"}
            </div>

            {/* Votes breakdown */}
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(nom.votes).map(([playerId, vote]) => (
                <span
                  key={playerId}
                  className={`px-1 py-0.5 text-[9px] font-mono border ${
                    vote === "APPROVE"
                      ? "border-success text-success"
                      : "border-error text-error"
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
