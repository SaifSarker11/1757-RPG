import React from "react";
import type { PublicView } from "@/lib/game-types";

interface PostGameSummaryProps {
  game: PublicView;
  playerNames?: Record<string, string>;
  onReturnToLobby?: () => void;
}

export function PostGameSummary({
  game,
  playerNames = {},
  onReturnToLobby,
}: PostGameSummaryProps) {
  const { outcome, results, players } = game;

  if (!outcome) return null;

  const winnerBadge =
    outcome.winner === "GREEN"
      ? "badge-success text-success-content"
      : outcome.winner === "RED"
        ? "badge-error text-error-content"
        : "badge-warning text-warning-content";

  return (
    <div className="bg-base-100 border-4 border-primary shadow-[8px_8px_0px_0px_var(--color-primary)] p-6 pixel-card flex flex-col gap-6">
      <div className="text-center border-b-4 border-double pb-4">
        <span className="text-xs uppercase font-pixel tracking-widest text-base-content/70">
          CONSPIRACY CONCLUDED
        </span>
        <h2 className="text-3xl font-historical font-black tracking-wide uppercase text-primary mt-1">
          {outcome.winner} VICTORY!
        </h2>
        <span className={`badge font-pixel uppercase font-bold py-2 px-4 text-xs mt-2 ${winnerBadge}`}>
          Reason: {outcome.reason.replace(/_/g, " ")}
        </span>
      </div>

      {/* Role reveals & player performance breakdown */}
      <div>
        <h3 className="text-lg font-historical font-bold text-primary uppercase mb-3">
          Final Identity Revelations & XP Credits
        </h3>
        <div className="overflow-x-auto">
          <table className="table table-zebra table-sm font-sans w-full border-2 border-base-300">
            <thead className="bg-base-200 font-pixel text-xs text-base-content">
              <tr>
                <th>Seat</th>
                <th>Player</th>
                <th>Role</th>
                <th>Faction</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => {
                const name = playerNames[p.id] ?? `Player ${p.id.slice(0, 6)}`;
                const res = results?.[p.id];
                const won = res?.won;
                const isHumiliated = res?.jeanLawLocked;

                return (
                  <tr key={p.id}>
                    <td className="font-pixel">#{p.seat + 1}</td>
                    <td className="font-bold">{name}</td>
                    <td className="font-mono font-bold">{p.role ?? res?.role}</td>
                    <td>
                      <span
                        className={`badge badge-sm font-pixel text-[10px] ${
                          (p.team ?? res?.team) === "GREEN"
                            ? "badge-success"
                            : (p.team ?? res?.team) === "RED"
                              ? "badge-error"
                              : "badge-warning"
                        }`}
                      >
                        {p.team ?? res?.team}
                      </span>
                    </td>
                    <td>
                      {won ? (
                        <span className="text-success font-pixel font-bold">WON</span>
                      ) : (
                        <span className="text-error font-pixel font-bold">LOST</span>
                      )}
                      {isHumiliated && (
                        <span className="badge badge-warning badge-xs ml-1 font-pixel">
                          CURSED
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {onReturnToLobby && (
        <button
          type="button"
          onClick={onReturnToLobby}
          className="btn btn-primary rounded-none font-pixel border-2 pixel-btn w-full"
        >
          RETURN TO COUNCIL LOBBY
        </button>
      )}
    </div>
  );
}
