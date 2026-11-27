import React from "react";
import type { MatchSummaryRow } from "@/lib/types";

interface MatchesTableProps {
  matches: MatchSummaryRow[];
  total: number;
}

export function MatchesTable({ matches, total }: MatchesTableProps) {
  if (matches.length === 0) {
    return (
      <div className="bg-surface border border-cream/20 p-8 rounded-lg text-center text-foreground/60 font-mono text-sm">
        No completed matches logged yet.
      </div>
    );
  }

  return (
    <div className="bg-surface border border-cream/20 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-cream/20 flex justify-between items-center">
        <h3 className="text-base font-bold text-foreground font-mono">Completed Matches ({total})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm font-sans">
          <thead className="bg-background/60 font-mono text-xs uppercase text-foreground/70 border-b border-cream/20">
            <tr>
              <th className="p-3">Room Code</th>
              <th className="p-3">Players</th>
              <th className="p-3">Score (G vs R)</th>
              <th className="p-3">Winner</th>
              <th className="p-3">End Reason</th>
              <th className="p-3">Ended At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream/15">
            {matches.map((m) => {
              const winnerColor =
                m.winner === "GREEN"
                  ? "text-gold bg-gold/15 border-gold/40"
                  : m.winner === "RED"
                    ? "text-cream bg-cream/10 border-cream/35"
                    : "text-gold bg-gold/15 border-gold/40";

              return (
                <tr key={m.id} className="hover:bg-gold/10 transition-colors">
                  <td className="p-3 font-mono font-bold text-foreground">{m.roomCode}</td>
                  <td className="p-3 text-foreground">{m.playerCount} players</td>
                  <td className="p-3 font-mono text-foreground">
                    <span className="text-gold">{m.roundsGreen}</span> -{" "}
                    <span className="text-cream">{m.roundsRed}</span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 text-xs font-mono font-bold border rounded ${winnerColor}`}>
                      {m.winner}
                    </span>
                  </td>
                  <td className="p-3 text-foreground/70 text-xs font-mono">{m.reason}</td>
                  <td className="p-3 text-foreground/70 text-xs font-mono">
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
