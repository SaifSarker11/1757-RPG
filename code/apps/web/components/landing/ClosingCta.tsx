import { Reveal } from "./Reveal";
import { PillLink } from "./PillLink";
import { fontBody, fontDisplay } from "./fonts";

export function ClosingCta() {
  return (
    <section
      id="begin"
      className="relative w-full overflow-hidden bg-[#0A0908] py-24 md:py-32"
    >
      {/* Warm glow echo of the hero */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 60% at 50% 30%, rgba(200,162,75,0.14) 0%, rgba(10,9,8,0) 70%)",
        }}
      />

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <Reveal>
          <h2
            className="text-4xl leading-[1.12] text-[#F6EFE1] md:text-6xl"
            style={fontDisplay}
          >
            Take your seat{" "}
            <span className="italic text-[#C8A24B]">at the table.</span>
          </h2>
        </Reveal>

        <Reveal delay={120}>
          <p
            className="mx-auto mt-5 max-w-xl leading-relaxed text-[#F6EFE1]/80 md:text-lg"
            style={fontBody}
          >
            Create a room, share the six-character code, and let the accusations
            fly. The court is waiting — and so is the traitor.
          </p>
        </Reveal>

        <Reveal delay={240}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3" style={fontBody}>
            <PillLink href="/login" className="px-7 py-3 text-base">
              Enter the Court
            </PillLink>
            <PillLink href="/signup" className="px-6 py-3 text-base">
              Create an Account
            </PillLink>
            <PillLink
              href="https://github.com/SaifSarker11/1757-RPG"
              external
              className="border-white/20 bg-white/5 px-6 py-3 text-base"
            >
              View Source
            </PillLink>
          </div>
        </Reveal>

        <Reveal delay={320}>
          <div
            className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-[13px] font-light text-white/45 md:flex-row"
            style={fontBody}
          >
            <span>1757 — Battle of Plassey · Murshidabad, Bengal</span>
            <span className="flex items-center gap-5">
              <a href="/login" className="hover:text-white/80">
                Log in
              </a>
              <a href="/signup" className="hover:text-white/80">
                Sign up
              </a>
              <a
                href="https://github.com/SaifSarker11/1757-RPG"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white/80"
              >
                GitHub
              </a>
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
