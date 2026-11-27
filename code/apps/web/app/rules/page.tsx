import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ROUND_STEPS, SEATS, TEAM_SIZES } from "@/lib/roles-content";

export const metadata: Metadata = {
  title: "Rules",
  description: "How to play 1757: setup, the six phases of a round, ballots, missions and the endgame.",
};

const TOC = [
  ["goal", "The goal"], ["setup", "Setup"], ["round", "A round"], ["ballot", "Ballots"],
  ["mission", "Missions"], ["endgame", "Endgame"], ["decree", "Royal Decree"], ["tables", "Tables"],
];

export default function RulesPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto grid w-full max-w-6xl gap-12 px-6 pt-36 lg:grid-cols-[200px_1fr]">
        <aside className="hidden lg:block">
          <nav className="sticky top-28 space-y-1 text-sm" aria-label="Rules sections">
            <p className="eyebrow mb-3">On this page</p>
            {TOC.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="block rounded-lg px-3 py-1.5 opacity-60 transition hover:bg-base-content/5 hover:opacity-100">{label}</a>
            ))}
          </nav>
        </aside>
        <article className="max-w-3xl [&_h2]:font-display [&_h2]:mt-20 [&_h2]:scroll-mt-28 [&_h2]:text-4xl [&_h2]:font-semibold [&_p]:mt-4 [&_p]:leading-relaxed [&_p]:opacity-80 [&_li]:leading-relaxed">
          <p className="eyebrow">Rulebook</p>
          <h1 className="font-display mt-4 text-6xl font-semibold leading-tight md:text-7xl">How to play <span className="italic text-gilded">1757</span></h1>
          <p className="text-lg">Plassey, 1757. The Nawab&apos;s court hides men and women who have already sold Bengal to the East India Company. Talk, vote and send ministers on missions — and work out who is lying before it&apos;s too late.</p>

          <h2 id="goal">The goal</h2>
          <p><strong className="text-loyal">Loyalists (Green)</strong> win by succeeding three of five missions. <strong className="text-traitor">Conspirators (Red)</strong> win by failing three. <strong className="text-banker">Jagat Seth</strong>, dealt only at 9+ players, wins alone with a correct endgame guess.</p>

          <h2 id="setup">Setup</h2>
          <p>Gather 6–15 players and share the six-letter room code. Each player is secretly dealt a historical role. Some roles see others at the start — the Nawab sees Lutfunnesa, most conspirators see each other, and Rai Durlabh is invisible to everyone.</p>

          <h2 id="round">A round</h2>
          <ol className="mt-6 space-y-3">
            {ROUND_STEPS.map((s) => (
              <li key={s.n} className="hairline flex gap-4 rounded-2xl border bg-base-200 p-5">
                <span className="font-mono text-xs text-primary">{s.n}</span>
                <div><p className="!mt-0 font-semibold !opacity-100">{s.title}</p><p className="!mt-1 text-sm">{s.text}</p></div>
              </li>
            ))}
          </ol>

          <h2 id="ballot">Ballots</h2>
          <p>Everyone votes Approve or Reject on the Leader&apos;s team. A tie rejects. Leadership passes to the next seat after every vote. <strong>Five rejections in one round hand that round to Red.</strong> Saint Frais and Yar Lutuf count double.</p>

          <h2 id="mission">Missions</h2>
          <p>Each chosen minister secretly plays <em>Success</em> or <em>Sabotage</em>. Loyalists must play Success. One Sabotage fails the round — except Round 4 with 7 or more players, which needs two. Cards are shuffled before they are revealed.</p>

          <h2 id="endgame">Endgame</h2>
          <p><strong className="text-traitor">Mir Jafar&apos;s steal:</strong> if Green wins three rounds, Mir Jafar names one player. If he names Mir Madan, Red wins instead.</p>
          <p><strong className="text-banker">Jagat Seth&apos;s gamble:</strong> he names Mir Jafar if Green is winning, or Rai Durlabh if Red is winning. Correct, and the whole game is his.</p>

          <h2 id="decree">Royal Decree mode</h2>
          <p>The host can set a discussion timer for each round, choose which characters may be dealt, pin roles to players, and pause or skip phases. Required partners are added automatically.</p>

          <h2 id="tables">Tables</h2>
          <div className="hairline mt-6 overflow-x-auto rounded-2xl border">
            <table className="table table-sm">
              <thead><tr><th>Players</th><th className="text-loyal">Green</th><th className="text-traitor">Red</th><th className="text-banker">Gold</th><th>Mission sizes (R1–R5)</th></tr></thead>
              <tbody>
                {Object.keys(SEATS).map((n) => {
                  const k = Number(n); const [g, r, au] = SEATS[k]!;
                  return <tr key={n}><td className="font-mono">{n}</td><td>{g}</td><td>{r}</td><td>{au}</td><td className="font-mono">{TEAM_SIZES[k]!.join(" · ")}</td></tr>;
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-16"><Link href="/login" className="btn btn-primary btn-lg lamp-glow rounded-full px-8">Start a game</Link></div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
