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

  const teamColor =
    me.team === "GREEN"
      ? "text-success border-success"
      : me.team === "RED"
        ? "text-error border-error"
        : "text-warning border-warning";

  const teamBadge =
    me.team === "GREEN"
      ? "badge-success text-success-content"
      : me.team === "RED"
        ? "badge-error text-error-content"
        : "badge-warning text-warning-content";

  return (
    <div className={`p-4 border-4 bg-base-100 pixel-card flex flex-col gap-3 ${teamColor}`}>
      <div className="flex items-center justify-between border-b-2 border-base-300 pb-2">
        <div>
          <span className="text-xs uppercase font-pixel tracking-wide block opacity-70">
            YOUR ASSIGNED ROLE
          </span>
          <h2 className="text-xl font-historical font-black tracking-wider uppercase">{me.role}</h2>
        </div>
        <span className={`badge font-pixel uppercase font-bold py-2 px-3 text-xs ${teamBadge}`}>
          {me.team}
        </span>
      </div>

      <div className="text-xs font-sans space-y-1">
        <div className="flex justify-between font-pixel">
          <span className="opacity-70">Seat Number:</span>
          <span className="font-bold">Seat #{me.seat + 1}</span>
        </div>
        {myVoteWeight > 1 && (
          <div className="flex justify-between font-pixel text-primary font-bold">
            <span>Ballot Weight:</span>
            <span>{myVoteWeight}x Vote</span>
          </div>
        )}
      </div>

      {/* Secret Visions / Information */}
      {vision.length > 0 && (
        <div className="mt-2 p-2 bg-base-200 border-2 border-base-300 text-xs">
          <span className="font-pixel font-bold text-primary block mb-1">SECRET INTEL / VISIONS:</span>
          <ul className="space-y-1 font-mono">
            {vision.map((entry) => (
              <li key={entry.playerId} className="flex justify-between items-center">
                <span>
                  #{entry.seat + 1} {playerNames[entry.playerId] ?? `Player ${entry.playerId.slice(0, 6)}`}:
                </span>
                <span className="font-bold text-accent">{visionText(entry.label)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Private Reveals (e.g. De Bussy) */}
      {reveals.length > 0 && (
        <div className="mt-1 p-2 bg-base-300 border border-base-content/20 text-xs">
          <span className="font-pixel font-bold text-warning block mb-1">REVEALED PLAYERS:</span>
          <ul className="space-y-1 font-mono">
            {reveals.map((entry) => (
              <li key={entry.playerId} className="flex justify-between items-center">
                <span>
                  #{entry.seat + 1} {playerNames[entry.playerId] ?? `Player ${entry.playerId.slice(0, 6)}`}:
                </span>
                <span className="font-bold">{roleName(entry.role)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
