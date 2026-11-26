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

  const resultById = new Map((results ?? []).map((r) => [r.playerId, r]));

  const winnerBadge =
    outcome.winner === "GREEN"
      ? "bg-emerald-950/70 text-emerald-300 border-emerald-500/40"
      : outcome.winner === "RED"
        ? "bg-red-950/70 text-red-300 border-red-500/40"
        : "bg-amber-950/70 text-amber-300 border-amber-500/40";

  return (
    <div className="council-panel rounded-2xl p-6 md:p-8 flex flex-col gap-6">
      <div className="text-center border-b border-[#C8A252]/20 pb-5">
        <span className="text-[10px] font-mono-code uppercase tracking-[0.25em] text-[#C8A252]">
          Conspiracy Concluded
        </span>
        <h2 className="font-display text-4xl font-bold tracking-wide text-[#F2ECE1] mt-1">
          {outcome.winner} Victory
        </h2>
        <span className={`inline-block mt-3 px-3.5 py-1 rounded-full border text-xs font-mono-code uppercase tracking-wider ${winnerBadge}`}>
          {outcome.reason.replace(/_/g, " ")}
        </span>
      </div>

      {/* Role reveals & player performance breakdown */}
      <div>
        <h3 className="font-display text-xl font-semibold text-[#F2ECE1] mb-3">
          Final Identity Revelations
        </h3>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="table table-sm w-full">
            <thead className="bg-white/[0.04] text-[10px] font-mono-code uppercase tracking-wider text-[#9E9587]">
              <tr>
                <th>Seat</th>
                <th>Player</th>
                <th>Role</th>
                <th>Faction</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {players.map((p) => {
                const name = playerNames[p.id] ?? `Player ${p.id.slice(0, 6)}`;
                const res = resultById.get(p.id);
                const won = res?.won;
                const isHumiliated = res?.jeanLawLocked;
                const team = p.team ?? res?.team;

                return (
                  <tr key={p.id} className="hover:bg-white/[0.02]">
                    <td className="font-mono-code text-[#9E9587]">#{p.seat + 1}</td>
                    <td className="font-semibold text-[#F2ECE1]">{name}</td>
                    <td className="font-mono-code text-[#C8A252]">{p.role ?? res?.role}</td>
                    <td>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono-code uppercase border ${
                          team === "GREEN"
                            ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/30"
                            : team === "RED"
                              ? "bg-red-950/60 text-red-300 border-red-500/30"
                              : "bg-amber-950/60 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {team}
                      </span>
                    </td>
                    <td>
                      {won ? (
                        <span className="text-emerald-400 font-mono-code font-semibold">WON</span>
                      ) : (
                        <span className="text-red-400 font-mono-code font-semibold">LOST</span>
                      )}
                      {isHumiliated && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300 text-[10px] font-mono-code">
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
          className="w-full py-3 rounded-xl bg-[#C8A252] text-[#0B0A08] font-semibold text-xs uppercase tracking-wider hover:bg-[#D6B366] active:scale-[0.98] transition-all cursor-pointer"
        >
          Return to Council Lobby
        </button>
      )}
    </div>
  );
}
