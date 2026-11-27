import React from "react";
import type { TelemetryOverview } from "@/lib/types";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: {
    text: string;
    variant: "green" | "red" | "neutral" | "amber";
  };
}

function MetricCard({ title, value, subtitle, badge }: MetricCardProps) {
  const badgeClasses = {
    green: "bg-gold/15 text-gold border-gold/40",
    red: "bg-cream/10 text-cream border-cream/35",
    amber: "bg-gold/15 text-gold border-gold/40",
    neutral: "bg-gold/15 text-foreground border-gold/35",
  }[badge?.variant ?? "neutral"];

  return (
    <div className="bg-surface/80 border border-cream/20 p-5 rounded-lg flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase font-mono tracking-wider text-foreground/70">{title}</span>
        {badge && (
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${badgeClasses}`}>
            {badge.text}
          </span>
        )}
      </div>
      <div>
        <div className="text-3xl font-black tracking-tight text-foreground">{value}</div>
        {subtitle && <p className="text-xs text-foreground/60 mt-1 font-sans">{subtitle}</p>}
      </div>
    </div>
  );
}

export function TelemetryGrid({ overview }: { overview: TelemetryOverview }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Registered Users"
        value={overview.registeredUsers}
        subtitle={`${overview.anonymousUsers} guest profiles`}
        badge={{ text: `${overview.totalUsers} total`, variant: "neutral" }}
      />
      <MetricCard
        title="Completed Matches"
        value={overview.finishedMatches}
        subtitle={`${overview.averagePlayerCount} avg players / match`}
        badge={{ text: `${overview.activeRooms} live now`, variant: "amber" }}
      />
      <MetricCard
        title="Green Faction Win Rate"
        value={`${overview.winRateGreen}%`}
        subtitle={`${overview.greenWins} total wins`}
        badge={{ text: "Loyalist", variant: "green" }}
      />
      <MetricCard
        title="Red Faction Win Rate"
        value={`${overview.winRateRed}%`}
        subtitle={`${overview.redWins} total wins`}
        badge={{ text: "Conspirator", variant: "red" }}
      />
    </div>
  );
}
