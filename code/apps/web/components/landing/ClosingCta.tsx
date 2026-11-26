import { Reveal } from "./Reveal";
import { PillLink } from "./PillLink";
import { fontMono, fontSans } from "./fonts";

export function ClosingCta() {
  return (
    <section id="begin" className="w-full pb-16 pt-8 md:pb-24">
      <div className="mx-auto max-w-6xl px-6">
        {/* Night shell — Supply dark panel inside a light canvas */}
        <Reveal>
          <div className="relative overflow-hidden rounded-[26px] bg-[#111] px-6 py-16 text-center shadow-[0_2px_4px_rgba(0,0,0,0.12),0_30px_60px_-28px_rgba(0,0,0,0.55)] md:px-16 md:py-24">
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(55% 60% at 50% 0%, rgba(255,82,6,0.16) 0%, rgba(17,17,17,0) 70%)",
              }}
            />
            <div aria-hidden className="grain-overlay" />

            <div className="relative">
              <p
                className="mb-5 text-[11px] font-medium uppercase tracking-[0.24em] text-white/40"
                style={fontMono}
              >
                Take your seat
              </p>
              <h2
                className="mx-auto max-w-2xl text-[34px] font-medium leading-[1.1] tracking-[-0.03em] text-white md:text-[52px]"
                style={fontSans}
              >
                The court is waiting.{" "}
                <span className="text-[#ff5206]">So is the traitor.</span>
              </h2>
              <p
                className="mx-auto mt-5 max-w-lg text-[15px] font-light leading-relaxed text-white/60 md:text-[16px]"
                style={fontSans}
              >
                Create a room, share the six-character code, and let the
                accusations fly. Free, browser-based, no download.
              </p>

              <div
                className="mt-9 flex flex-wrap items-center justify-center gap-3"
                style={fontSans}
              >
                <PillLink href="/login" className="px-7 py-3 text-[15px]">
                  Enter the Court
                </PillLink>
                <PillLink
                  href="/signup"
                  variant="dark"
                  className="px-6 py-3 text-[15px]"
                >
                  Create an Account
                </PillLink>
                <PillLink
                  href="https://github.com/SaifSarker11/1757-RPG"
                  external
                  variant="dark"
                  className="px-6 py-3 text-[15px]"
                >
                  View Source
                </PillLink>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Footer — Supply marketplace footer rhythm */}
        <Reveal delay={120}>
          <footer className="mt-10" style={fontSans}>
            <div className="flex flex-col justify-between gap-8 border-t border-[#e6e6e4] py-10 md:flex-row">
              <div>
                <p className="text-[17px] font-semibold tracking-[-0.02em] text-[#111]">
                  1757
                </p>
                <p className="mt-2 max-w-xs text-[13px] font-light leading-relaxed text-[#8a8a8a]">
                  A real-time social-deduction game set at the Battle of
                  Plassey. Built with Next.js, Fastify and Socket.IO.
                </p>
              </div>
              <div className="flex gap-16">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8a8a8a]" style={fontMono}>
                    Game
                  </p>
                  <ul className="mt-3 space-y-2 text-[13px] font-light text-[#5c5c5c]">
                    <li><a href="#how" className="transition-colors hover:text-[#111]">How to Play</a></li>
                    <li><a href="#factions" className="transition-colors hover:text-[#111]">The Factions</a></li>
                    <li><a href="#roles" className="transition-colors hover:text-[#111]">The Roles</a></li>
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8a8a8a]" style={fontMono}>
                    Account
                  </p>
                  <ul className="mt-3 space-y-2 text-[13px] font-light text-[#5c5c5c]">
                    <li><a href="/login" className="transition-colors hover:text-[#111]">Log in</a></li>
                    <li><a href="/signup" className="transition-colors hover:text-[#111]">Sign up</a></li>
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8a8a8a]" style={fontMono}>
                    Project
                  </p>
                  <ul className="mt-3 space-y-2 text-[13px] font-light text-[#5c5c5c]">
                    <li>
                      <a
                        href="https://github.com/SaifSarker11/1757-RPG"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors hover:text-[#111]"
                      >
                        GitHub
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div
              className="flex flex-col items-center justify-between gap-3 border-t border-[#e6e6e4] py-6 text-[11px] uppercase tracking-[0.14em] text-[#8a8a8a] md:flex-row"
              style={fontMono}
            >
              <span>© 2026 1757 — Battle of Plassey · Murshidabad, Bengal</span>
              <span>Play free · No download</span>
            </div>
          </footer>
        </Reveal>
      </div>
    </section>
  );
}
