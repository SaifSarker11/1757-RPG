import Image from "next/image";
import type { CourtRole } from "@/lib/roles-content";

const TEAM_STYLE = {
  GREEN: { chip: "bg-loyal/15 text-loyal", ring: "from-loyal/40", label: "Loyalist" },
  RED: { chip: "bg-traitor/15 text-traitor", ring: "from-traitor/40", label: "Conspirator" },
  GOLD: { chip: "bg-banker/15 text-banker", ring: "from-banker/40", label: "Neutral" },
} as const;

export function CourtCard({ role, large = false }: { role: CourtRole; large?: boolean }) {
  const t = TEAM_STYLE[role.team];
  const initials = role.name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <article className="card-lift hairline group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-base-200">
      <div className={`relative ${large ? "aspect-[4/5]" : "aspect-square"} overflow-hidden`}>
        {role.portrait ? (
          <Image
            src={role.portrait}
            alt={`Portrait of ${role.name}`}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className={`flex h-full items-center justify-center bg-gradient-to-br ${t.ring} to-base-300`}>
            <span className="font-display text-7xl font-semibold opacity-40">{initials}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-base-200 via-base-200/10 to-transparent" />
        <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] backdrop-blur ${t.chip}`}>
          {t.label}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5 pt-0">
        <p className="eyebrow">{role.title}</p>
        <h3 className="font-display mt-1 text-2xl font-semibold leading-tight">{role.name}</h3>
        <p className="mt-2 text-sm leading-relaxed opacity-70">{role.power}</p>
        {role.requires && (
          <p className="mt-auto pt-4 text-xs opacity-50">Requires: {role.requires.join(", ")}</p>
        )}
      </div>
    </article>
  );
}
