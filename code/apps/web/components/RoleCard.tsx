import React from "react";
import type { PlayerView, VisionLabel } from "@/lib/game-types";

/** "YAR_LUTUF" → "Yar Lutuf". */
function roleName(role: string): string {
  return role
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function visionText(label: VisionLabel): string {
  if (label.kind === "ROLE") return roleName(label.role);
  if (label.kind === "RED") return "Red conspirator";
  return "Suspect";
}

interface RoleCardProps {
  view: PlayerView;
  playerNames?: Record<string, string>;
}

export function RoleCard({ view, playerNames = {} }: RoleCardProps) {
  const { me, vision, reveals, myVoteWeight } = view;

  const teamBorder =
    me.team === "GREEN"
      ? "border-emerald-500/40"
      : me.team === "RED"
        ? "border-red-500/40"
        : "border-amber-500/40";

  const teamBadge =
    me.team === "GREEN"
      ? "bg-emerald-950/70 text-emerald-300 border-emerald-500/40"
      : me.team === "RED"
        ? "bg-red-950/70 text-red-300 border-red-500/40"
        : "bg-amber-950/70 text-amber-300 border-amber-500/40";

  return (
    <div className={`p-5 rounded-2xl council-panel border ${teamBorder} flex flex-col gap-4`}>
      <div className="flex items-start justify-between border-b border-white/10 pb-3 gap-3">
        <div>
          <span className="text-[10px] font-mono-code uppercase tracking-[0.2em] text-[#9E9587] block">
            Secret Dossier
          </span>
          <h2 className="font-display text-2xl font-bold tracking-wide text-[#F2ECE1] mt-0.5">
            {roleName(me.role)}
          </h2>
        </div>
        <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono-code uppercase tracking-wider font-semibold ${teamBadge}`}>
          {me.team}
        </span>
      </div>

      <div className="text-xs space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[#9E9587]">Seat Position</span>
          <span className="font-mono-code font-semibold text-[#F2ECE1]">Seat #{me.seat + 1}</span>
        </div>
        {myVoteWeight > 1 && (
          <div className="flex justify-between items-center text-[#C8A252]">
            <span>Ballot Weight</span>
            <span className="font-mono-code font-semibold">{myVoteWeight}x Vote</span>
          </div>
        )}
      </div>

      {/* Secret Visions / Information */}
      {vision.length > 0 && (
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-[#C8A252]/20 text-xs space-y-2">
          <span className="text-[10px] font-mono-code uppercase tracking-[0.18em] text-[#C8A252] block">
            Secret Intelligence
          </span>
          <ul className="space-y-1.5">
            {vision.map((entry) => (
              <li key={entry.playerId} className="flex justify-between items-center gap-2">
                <span className="text-[#F2ECE1]/85 truncate">
                  <span className="font-mono-code text-[#9E9587] mr-1">#{entry.seat + 1}</span>
                  {playerNames[entry.playerId] ?? `Player ${entry.playerId.slice(0, 6)}`}
                </span>
                <span className="font-mono-code text-[11px] font-semibold text-[#C8A252] shrink-0">
                  {visionText(entry.label)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Private Reveals (e.g. De Bussy) */}
      {reveals.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-950/25 border border-amber-500/30 text-xs space-y-2">
          <span className="text-[10px] font-mono-code uppercase tracking-[0.18em] text-amber-300 block">
            Revealed Identities
          </span>
          <ul className="space-y-1.5">
            {reveals.map((entry) => (
              <li key={entry.playerId} className="flex justify-between items-center gap-2">
                <span className="text-[#F2ECE1]/85 truncate">
                  <span className="font-mono-code text-[#9E9587] mr-1">#{entry.seat + 1}</span>
                  {playerNames[entry.playerId] ?? `Player ${entry.playerId.slice(0, 6)}`}
                </span>
                <span className="font-mono-code text-[11px] font-semibold text-amber-200 shrink-0">
                  {roleName(entry.role)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
