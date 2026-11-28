import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { CourtCard } from "@/components/site/RoleCard";
import { FACTION_STYLES } from "@/lib/preferences";
import { BATTLEFIELD_ART } from "@/lib/artwork";
import { COURT, FACTION_META, ROUND_STEPS } from "@/lib/roles-content";

const FEATURED = ["NAWAB_SIRAJ", "MIR_JAFAR", "LUTFUNNESA", "JAGAT_SETH"];

export default function Landing() {
  const featured = FEATURED.flatMap((id) => { const role = COURT.find((r) => r.id === id); return role ? [role] : []; });
  return (
    <>
      <SiteNav />
      <main>
        {/* Hero — Tabletales composition: gold line, edge-to-edge title, art rising through it */}
        <section className="opening-hero">
          <p className="eyebrow rise text-center">
            Bengal, 1757 · A kingdom is lost by the hands that betray it
          </p>
          <div className="opening-stage">
          <h1 aria-label="1757" className="opening-title font-display">
            <span className="display-tall letter-mask justify-center" aria-hidden="true">
              {"1757".split("").map((c, i) => (
                <span key={i} className="letter" style={{ ["--i" as string]: i }}>{c}</span>
              ))}
            </span>
          </h1>
          <div className="opening-duel" data-parallax>
            <Image src="/images/hero-duel.webp" alt="Nawab Siraj-ud-Daulah and Robert Clive crossing swords in the iconic ornamental 1757 illustration" width={900} height={900} priority className="art-in h-auto w-full" />
          </div>
          </div>
          <div className="opening-copy mx-auto max-w-3xl px-6 text-center">
            <p className="text-lg opacity-80 md:text-xl">
              A real-time social-deduction game for 6–15 players. Secret roles, five rounds, and one question: who sold Bengal to the Company?
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link href="/login" className="btn btn-primary btn-lg rounded-full px-9 uppercase tracking-[0.2em] text-sm">Gather your court</Link>
              <Link href="/rules" className="btn btn-outline btn-lg rounded-full border-primary/40 px-9 text-sm uppercase tracking-[0.2em] text-primary hover:border-primary hover:bg-primary hover:text-primary-content">Read the rules</Link>
            </div>
            <dl className="mt-14 grid grid-cols-3 gap-6">
              {[["6–15", "players"], ["20", "secret roles"], ["5", "rounds"]].map(([v, l]) => (
                <div key={l} className="hairline border-t pt-4">
                  <dt className="font-display text-4xl font-black">{v}</dt>
                  <dd className="eyebrow mt-1">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Factions */}
        <section className="mx-auto max-w-6xl px-6 py-28">
          <p className="eyebrow">Choose no side. You are dealt one.</p>
          <h2 className="font-display mt-4 max-w-3xl text-5xl font-semibold leading-tight md:text-6xl">Two factions, one banker, and nobody you can trust.</h2>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {(["GREEN", "RED", "GOLD"] as const).map((f) => (
              <div key={f} className={`card-lift hairline rounded-3xl border p-8 ${FACTION_STYLES[f].surface}`}>
                <span className={`eyebrow ${FACTION_META[f].tone}`}>{FACTION_META[f].short}</span>
                <h3 className="font-display mt-3 text-3xl font-semibold">{FACTION_META[f].label}</h3>
                <p className="mt-3 text-sm leading-relaxed opacity-70">{FACTION_META[f].text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How to play */}
        <section id="how" className="hairline scroll-mt-24 border-y bg-base-200/50">
          <div className="mx-auto max-w-6xl px-6 py-28">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow">How a round unfolds</p>
                <h2 className="font-display mt-4 text-5xl font-semibold md:text-6xl">Six moves. <span className="italic text-primary">One liar.</span></h2>
              </div>
              <Link href="/rules" className="btn btn-outline rounded-full">Full rules →</Link>
            </div>
            <ol className="mt-14 grid gap-px overflow-hidden rounded-3xl bg-base-content/10 sm:grid-cols-2 lg:grid-cols-3">
              {ROUND_STEPS.map((s) => (
                <li key={s.n} className="group bg-base-100 p-8 transition-colors hover:bg-base-200">
                  <span className="font-mono text-xs text-primary">{s.n}</span>
                  <h3 className="font-display mt-6 text-2xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed opacity-70">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Characters */}
        <section className="mx-auto max-w-6xl px-6 py-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">The court</p>
              <h2 className="font-display mt-4 max-w-2xl text-5xl font-semibold md:text-6xl">Every seat hides a story.</h2>
            </div>
            <Link href="/characters" className="btn btn-outline rounded-full">All 20 characters →</Link>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((r) => <CourtCard key={r.id} role={r} large />)}
          </div>
        </section>

        {/* Endgame */}
        <section className="mx-auto max-w-6xl px-6">
          <div className="hairline grid gap-8 rounded-[2rem] border bg-base-200 p-10 md:grid-cols-2 md:p-14">
            <div>
              <p className="eyebrow">When three rounds are won</p>
              <h2 className="font-display mt-4 text-4xl font-semibold md:text-5xl">The game isn&apos;t over. The knives come out.</h2>
            </div>
            <div className="space-y-6 text-sm leading-relaxed">
              <p><strong className="text-traitor">Mir Jafar&apos;s steal.</strong> <span className="opacity-70">If the Loyalists win, Mir Jafar names one player. If it&apos;s Mir Madan, Red takes the game.</span></p>
              <p><strong className="text-banker">Jagat Seth&apos;s gamble.</strong> <span className="opacity-70">The banker names Mir Jafar if Green leads, or Rai Durlabh if Red leads. A correct guess and he wins alone.</span></p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative mx-auto mt-28 max-w-6xl overflow-hidden rounded-[2rem] px-6">
          <div className="relative overflow-hidden rounded-[2rem]">
            <Image src={BATTLEFIELD_ART} alt="" fill unoptimized sizes="100vw" className="object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-base-100/80 to-base-100" />
            <div className="relative flex flex-col items-center px-6 py-24 text-center">
              <h2 className="font-display max-w-3xl text-5xl font-semibold md:text-7xl">The Nawab is waiting.</h2>
              <p className="mt-5 max-w-md opacity-75">Jump in as a guest in seconds, share a six-letter room code, and let the accusations begin.</p>
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <Link href="/login" className="btn btn-primary btn-lg lamp-glow rounded-full px-8">Play free</Link>
                <Link href="/signup" className="btn btn-ghost btn-lg frost rounded-full px-8">Create an account</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
