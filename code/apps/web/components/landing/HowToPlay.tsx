import { Reveal } from "./Reveal";
import { fontBody, fontDisplay } from "./fonts";

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
    <section id="how" className="w-full bg-[#FAE2C7] py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p
            className="mb-4 text-[12px] font-medium uppercase tracking-[0.3em] text-[#B08A3C]"
            style={fontBody}
          >
            How a round unfolds
          </p>
          <h2
            className="max-w-2xl text-4xl leading-[1.1] text-[#2E2010] md:text-5xl"
            style={fontDisplay}
          >
            Five rounds. Six moves.{" "}
            <span className="italic text-[#B08A3C]">One liar.</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.number} delay={i * 90}>
              <div className="h-full rounded-3xl border border-[#2E2010]/10 bg-[#FFF6E6]/80 p-7 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5">
                <span
                  className="block text-[15px] italic text-[#B08A3C]"
                  style={fontDisplay}
                >
                  {step.number}
                </span>
                <h3
                  className="mt-3 text-[24px] leading-tight text-[#2E2010]"
                  style={fontDisplay}
                >
                  {step.title}
                </h3>
                <p
                  className="mt-3 text-[15px] font-light leading-relaxed text-[#2E2010]/70"
                  style={fontBody}
                >
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
