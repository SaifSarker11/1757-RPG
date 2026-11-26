import { Reveal } from "./Reveal";
import { fontMono, fontSans, ui } from "./fonts";

const STEPS = [
  {
    number: "01",
    title: "Role Reveal",
    text: "You see your secret role — and anything it lets you know about the others.",
  },
  {
    number: "02",
    title: "Discussion",
    text: "Talk, accuse and bluff. The host sets the timer, from 30 to 300 seconds.",
  },
  {
    number: "03",
    title: "Selection",
    text: "The round's Leader picks the ministers for the mission. The team grows every round.",
  },
  {
    number: "04",
    title: "The Ballot",
    text: "Everyone votes Approve or Reject. A tie rejects, leadership rotates, and five rejections hand the round to Red.",
  },
  {
    number: "05",
    title: "The Mission",
    text: "Ministers secretly play Success or Sabotage. A single Sabotage fails the round.",
  },
  {
    number: "06",
    title: "The Result",
    text: "The cards are revealed shuffled — so nobody can tell who betrayed the round.",
  },
];

export function HowToPlay() {
  return (
    <section id="how" className="w-full py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className={`${ui.label} mb-4`} style={fontMono}>
                How a round unfolds
              </p>
              <h2 className="max-w-2xl text-[32px] font-medium leading-[1.12] tracking-[-0.02em] text-[#111] md:text-[44px]" style={fontSans}>
                Five rounds. Six moves.{" "}
                <span className="text-[#ff5206]">One liar.</span>
              </h2>
            </div>
            <span
              className="rounded-full border border-[#e6e6e4] bg-white px-3.5 py-1.5 text-[11px] uppercase tracking-[0.14em] text-[#5c5c5c]"
              style={fontMono}
            >
              06 steps · host timer 30–300s
            </span>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.number} delay={i * 70}>
              <div className={`${ui.card} ${ui.cardHover} h-full p-7`} style={fontSans}>
                <span
                  className="text-[12px] font-medium tracking-[0.18em] text-[#ff5206]"
                  style={fontMono}
                >
                  {step.number}
                </span>
                <h3 className="mt-4 text-[19px] font-medium leading-snug tracking-[-0.01em] text-[#111]" style={fontSans}>
                  {step.title}
                </h3>
                <p className="mt-2.5 text-[14px] font-light leading-relaxed text-[#5c5c5c]" style={fontSans}>
                  {step.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
