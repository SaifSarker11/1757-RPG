import { Reveal } from "./Reveal";
import { fontMono, fontSans, ui } from "./fonts";

const FACTIONS = [
  {
    name: "The Nawab's Loyalists",
    chip: "Loyal to the Nawab",
    team: "GREEN",
    accent: "#1f6b3f",
    wash: "#eaf5ee",
    meta: "Majority · Uninformed",
    title: "The majority — and the blind.",
    text: "They hold the court, but they don't know one another. Pass three missions out of five and Bengal stays loyal… if you can work out who to trust.",
  },
  {
    name: "The Company's Conspirators",
    chip: "For the Company",
    team: "RED",
    accent: "#a8291b",
    wash: "#fdeeec",
    meta: "Minority · Informed",
    title: "The minority — and the informed.",
    text: "The East India Company's agents hide inside the court. They mostly know each other, and every mission they touch can be sabotaged from within.",
  },
];

export function Factions() {
  return (
    <section id="factions" className="w-full py-4 md:py-8">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className={`${ui.label} mb-4`} style={fontMono}>
            The Factions
          </p>
          <h2
            className="max-w-2xl text-[32px] font-medium leading-[1.12] tracking-[-0.02em] text-[#111] md:text-[44px]"
            style={fontSans}
          >
            Two sides. <span className="text-[#ff5206]">One court.</span>
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {FACTIONS.map((faction, i) => (
            <Reveal key={faction.team} delay={i * 100}>
              <div className={`${ui.card} ${ui.cardHover} relative h-full overflow-hidden p-8`} style={fontSans}>
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ background: faction.accent }}
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em]"
                    style={{ background: faction.wash, color: faction.accent, ...fontMono }}
                  >
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: faction.accent }}
                    />
                    {faction.chip}
                  </span>
                  <span
                    className="text-[10px] uppercase tracking-[0.18em] text-[#8a8a8a]"
                    style={fontMono}
                  >
                    {faction.meta}
                  </span>
                </div>
                <h3 className="mt-5 text-[24px] font-medium leading-tight tracking-[-0.02em] text-[#111]" style={fontSans}>
                  {faction.name}
                </h3>
                <p className="mt-1.5 text-[15px] font-light text-[#8a8a8a]" style={fontSans}>
                  {faction.title}
                </p>
                <p className="mt-4 text-[15px] font-light leading-relaxed text-[#5c5c5c]" style={fontSans}>
                  {faction.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Wildcard strip — Supply warn washes */}
        <Reveal delay={160}>
          <div
            className="mt-4 rounded-[18px] border border-[#e6e6e4] bg-[#fdf4e3] p-8"
            style={fontSans}
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="md:w-1/2">
                <span
                  className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[#8a5a00]"
                  style={fontMono}
                >
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#8a5a00]" />
                  The Wildcard
                </span>
                <h3 className="mt-4 text-[24px] font-medium leading-tight tracking-[-0.02em] text-[#111]" style={fontSans}>
                  Jagat Seth, the banker
                </h3>
                <p className="mt-3 text-[15px] font-light leading-relaxed text-[#5c5c5c]" style={fontSans}>
                  Dealt only in games of nine or more. He plays for no faction:
                  at the endgame he names one player — guess right and the whole
                  match is his, alone.
                </p>
              </div>
              <div className="md:w-1/2 md:border-l md:border-[#111]/10 md:pl-8">
                <h4 className="text-[19px] font-medium leading-tight tracking-[-0.01em] text-[#111]" style={fontSans}>
                  Mir Jafar&apos;s steal
                </h4>
                <p className="mt-3 text-[15px] font-light leading-relaxed text-[#5c5c5c]" style={fontSans}>
                  If Green wins on rounds, the game is not over: Mir Jafar gets
                  one guess. Name Mir Madan correctly and the win is stolen for
                  the Company.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
