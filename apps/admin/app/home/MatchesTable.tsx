import React from "react";
import type { MatchSummaryRow } from "@/lib/types";

interface MatchesTableProps {
  matches: MatchSummaryRow[];
  total: number;
}

export function MatchesTable({ matches, total }: MatchesTableProps) {
  if (matches.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-lg text-center text-zinc-500 font-mono text-sm">
        No completed matches logged yet.
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
        <h3 className="text-base font-bold text-zinc-100 font-mono">Completed Matches ({total})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm font-sans">
          <thead className="bg-zinc-950/60 font-mono text-xs uppercase text-zinc-400 border-b border-zinc-800">
            <tr>
              <th className="p-3">Room Code</th>
              <th className="p-3">Players</th>
              <th className="p-3">Score (G vs R)</th>
              <th className="p-3">Winner</th>
              <th className="p-3">End Reason</th>
              <th className="p-3">Ended At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850">
            {matches.map((m) => {
              const winnerColor =
                m.winner === "GREEN"
                  ? "text-emerald-400 bg-emerald-950/40 border-emerald-800"
                  : m.winner === "RED"
                    ? "text-rose-400 bg-rose-950/40 border-rose-800"
                    : "text-amber-400 bg-amber-950/40 border-amber-800";

              return (
                <tr key={m.id} className="hover:bg-zinc-850/50 transition-colors">
                  <td className="p-3 font-mono font-bold text-zinc-200">{m.roomCode}</td>
                  <td className="p-3 text-zinc-300">{m.playerCount} players</td>
                  <td className="p-3 font-mono text-zinc-300">
                    <span className="text-emerald-400">{m.roundsGreen}</span> -{" "}
                    <span className="text-rose-400">{m.roundsRed}</span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 text-xs font-mono font-bold border rounded ${winnerColor}`}>
                      {m.winner}
                    </span>
                  </td>
                  <td className="p-3 text-zinc-400 text-xs font-mono">{m.reason}</td>
                  <td className="p-3 text-zinc-400 text-xs font-mono">
                    {new Date(m.endedAt).toLocaleTimeString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
