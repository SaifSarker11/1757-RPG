import React from "react";
import type { MatchSummaryRow } from "@/lib/types";

interface MatchesTableProps {
  matches: MatchSummaryRow[];
  total: number;
}

export function MatchesTable({ matches, total }: MatchesTableProps) {
  if (matches.length === 0) {
    return (
      <div className="bg-gradient-to-br from-crimson/80 to-bronze/60 border border-bronze p-8 rounded-lg text-center text-champagne/60 font-mono text-sm">
        No completed matches logged yet.
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-crimson/80 to-bronze/60 border border-bronze rounded-lg overflow-hidden">
      <div className="p-4 border-b border-bronze flex justify-between items-center">
        <h3 className="text-base font-bold text-champagne font-mono">Completed Matches ({total})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm font-sans">
          <thead className="bg-ink/60 font-mono text-xs uppercase text-champagne/70 border-b border-bronze">
            <tr>
              <th className="p-3">Room Code</th>
              <th className="p-3">Players</th>
              <th className="p-3">Score (G vs R)</th>
              <th className="p-3">Winner</th>
              <th className="p-3">End Reason</th>
              <th className="p-3">Ended At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bronze/50">
            {matches.map((m) => {
              const winnerColor =
                m.winner === "GREEN"
                  ? "text-champagne bg-bronze/40 border-champagne/50"
                  : m.winner === "RED"
                    ? "text-royal bg-crimson/60 border-royal"
                    : "text-champagne bg-bronze/40 border-bronze";

              return (
                <tr key={m.id} className="hover:bg-crimson/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-champagne">{m.roomCode}</td>
                  <td className="p-3 text-champagne/90">{m.playerCount} players</td>
                  <td className="p-3 font-mono text-champagne/90">
                    <span className="text-champagne">{m.roundsGreen}</span> -{" "}
                    <span className="text-royal">{m.roundsRed}</span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 text-xs font-mono font-bold border rounded ${winnerColor}`}>
                      {m.winner}
                    </span>
                  </td>
                  <td className="p-3 text-champagne/70 text-xs font-mono">{m.reason}</td>
                  <td className="p-3 text-champagne/70 text-xs font-mono">
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
