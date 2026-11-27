"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { COURT } from "@/lib/roles-content";

/** Which side a team plays for, in the words players use at the table. */
export const SIDE_LABEL: Record<string, string> = {
  GREEN: "Nawab's Loyalists",
  RED: "East India Company",
  GOLD: "Neutral · The Banker",
};

const SIDE_TONE: Record<string, string> = {
  GREEN: "text-loyal border-loyal/50 bg-loyal/10",
  RED: "text-traitor border-traitor/50 bg-traitor/10",
  GOLD: "text-banker border-banker/50 bg-banker/10",
};

export function courtEntry(role: string) {
  return COURT.find((c) => c.id === role);
}

interface Props {
  role: string;
  team: string;
  /** Changes once per match so the reveal shows exactly once per deal. */
  matchKey: string;
}

/**
 * Full-screen character reveal shown when roles are dealt: the portrait rises out of
 * a curtain, then "You are <name>" and the side the player fights for.
 */
export function RoleReveal({ role, team, matchKey }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const key = `revealed:${matchKey}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    setOpen(true);
    const t = setTimeout(() => setOpen(false), 6500);
    return () => clearTimeout(t);
  }, [matchKey]);

  if (!open) return null;
  const c = courtEntry(role);
  const name = c?.name ?? role.replace(/_/g, " ");

  return (
    <div
      role="dialog"
      aria-label={`You are ${name}`}
      onClick={() => setOpen(false)}
      className="role-reveal fixed inset-0 z-[120] grid cursor-pointer place-items-center bg-base-300/95 p-6 backdrop-blur"
    >
      <div className="grid w-full max-w-4xl items-center gap-10 md:grid-cols-[minmax(0,340px)_1fr]">
        <div className="role-reveal__portrait relative aspect-[3/4] w-full overflow-hidden rounded-3xl border border-base-content/10 shadow-2xl">
          {c?.portrait ? (
            <Image src={c.portrait} alt={name} fill sizes="340px" className="object-cover" priority />
          ) : (
            <div className="grid h-full place-items-center bg-base-200 font-display text-6xl">{name[0]}</div>
          )}
        </div>
        <div className="role-reveal__text">
          <p className="eyebrow">Your seal is broken</p>
          <h2 className="font-display mt-4 text-5xl font-semibold leading-[1.02] md:text-7xl">
            You are <span className="italic text-gilded">{name}</span>.
          </h2>
          {c?.title && <p className="mt-3 text-lg opacity-70">{c.title}</p>}
          <span className={`mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium ${SIDE_TONE[team] ?? ""}`}>
            <span className="h-2 w-2 rounded-full bg-current" />
            {SIDE_LABEL[team] ?? team}
          </span>
          {c?.power && <p className="mt-6 max-w-md text-base leading-relaxed opacity-80">{c.power}</p>}
          <p className="mt-8 text-xs uppercase tracking-[0.2em] opacity-40">Tap anywhere to take your seat</p>
        </div>
      </div>
    </div>
  );
}
