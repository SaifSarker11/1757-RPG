import { Reveal } from "./Reveal";
import { fontBody, fontDisplay } from "./fonts";

const FACTIONS = [
  {
    name: "The Nawab's Loyalists",
    team: "GREEN",
    accent: "#456B31",
    title: "The majority — and the blind.",
    text: "They hold the court, but they don't know one another. Pass three missions out of five and Bengal stays loyal… if you can work out who to trust.",
  },
  {
    name: "The Company's Conspirators",
    team: "RED",
    accent: "#93372A",
    title: "The minority — and the informed.",
    text: "The East India Company's agents hide inside the court. They mostly know each other, and every mission they touch can be sabotaged from within.",
  },
];

export function Factions() {
  return (
    <section id="factions" className="w-full bg-[#FAE2C7] pb-24 md:pb-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p
            className="mb-4 text-[12px] font-medium uppercase tracking-[0.3em] text-[#B08A3C]"
            style={fontBody}
          >
            The Factions
          </p>
          <h2
            className="max-w-2xl text-4xl leading-[1.1] text-[#2E2010] md:text-5xl"
            style={fontDisplay}
          >
            Two sides. <span className="italic text-[#B08A3C]">One court.</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {FACTIONS.map((faction, i) => (
            <Reveal key={faction.team} delay={i * 140}>
              <div className="relative h-full overflow-hidden rounded-3xl border border-[#2E2010]/10 bg-[#FFF6E6]/80 p-8">
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1.5"
                  style={{ background: faction.accent }}
                />
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: faction.accent }}
                  />
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.28em]"
                    style={{ color: faction.accent, ...fontBody }}
                  >
                    {faction.team === "GREEN" ? "Loyal to the Nawab" : "For the Company"}
                  </p>
                </div>
                <h3
                  className="mt-4 text-[30px] leading-tight text-[#2E2010]"
                  style={fontDisplay}
                >
                  {faction.name}
                </h3>
                <p
                  className="mt-2 text-[16px] italic text-[#B08A3C]"
                  style={fontDisplay}
                >
                  {faction.title}
                </p>
                <p
                  className="mt-4 text-[15px] font-light leading-relaxed text-[#2E2010]/70"
                  style={fontBody}
                >
                  {faction.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Endgame strip */}
        <Reveal delay={200}>
          <div className="mt-6 rounded-3xl border border-[#B08A3C]/35 bg-[#FFF6E6]/60 p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="md:w-1/2">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 rounded-full bg-[#B08A3C]"
                  />
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#B08A3C]"
                    style={fontBody}
                  >
                    The Wildcard
                  </p>
                </div>
                <h3
                  className="mt-3 text-[28px] leading-tight text-[#2E2010]"
                  style={fontDisplay}
                >
                  Jagat Seth, the banker
                </h3>
                <p
                  className="mt-3 text-[15px] font-light leading-relaxed text-[#2E2010]/70"
                  style={fontBody}
                >
                  Dealt only in games of nine or more. He plays for no faction:
                  at the endgame he names one player — guess right and the whole
                  match is his, alone.
                </p>
              </div>
              <div className="md:w-1/2 md:border-l md:border-[#2E2010]/10 md:pl-8">
                <h4
                  className="text-[22px] leading-tight text-[#2E2010]"
                  style={fontDisplay}
                >
                  Mir Jafar&apos;s steal
                </h4>
                <p
                  className="mt-3 text-[15px] font-light leading-relaxed text-[#2E2010]/70"
                  style={fontBody}
                >
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
