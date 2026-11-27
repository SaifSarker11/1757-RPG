import type { Metadata } from "next";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { CourtCard } from "@/components/site/RoleCard";
import { COURT, FACTION_META, type Faction } from "@/lib/roles-content";

export const metadata: Metadata = {
  title: "Characters",
  description: "All 17 roles of 1757 — the Nawab's loyalists, the Company's conspirators and the banker Jagat Seth.",
};

export default function CharactersPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl px-6 pt-36">
        <p className="eyebrow">The court of Murshidabad</p>
        <h1 className="font-display mt-4 max-w-3xl text-6xl font-semibold leading-tight md:text-7xl">Twenty roles. <span className="italic text-gilded">Fifteen seats.</span></h1>
        <p className="mt-6 max-w-xl opacity-70">Some roles bring others with them — Mir Jafar never sits without Mir Madan. In Royal Decree mode the host picks exactly who is dealt in.</p>
        {(["GREEN", "RED", "GOLD"] as Faction[]).map((f) => (
          <section key={f} className="mt-20">
            <div className="hairline flex flex-wrap items-baseline justify-between gap-4 border-b pb-4">
              <h2 className={`font-display text-4xl font-semibold ${FACTION_META[f].tone}`}>{FACTION_META[f].label}</h2>
              <p className="max-w-md text-sm opacity-60">{FACTION_META[f].text}</p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {COURT.filter((r) => r.team === f).map((r) => <CourtCard key={r.id} role={r} />)}
            </div>
          </section>
        ))}
      </main>
      <SiteFooter />
    </>
  );
}
