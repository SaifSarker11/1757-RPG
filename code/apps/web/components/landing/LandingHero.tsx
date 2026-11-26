"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { PillLink } from "./PillLink";
import { fontBody, fontDisplay } from "./fonts";

const NAV_LINKS = [
  { label: "How to Play", href: "#how" },
  { label: "The Factions", href: "#factions" },
  { label: "The Roles", href: "#roles" },
];

const VIDEO_SRC = "https://cdn.jiro.build/Kelo/Hero%2003.mp4";

const STATS = [
  { figure: "6–15", label: "Players" },
  { figure: "17", label: "Secret Roles" },
  { figure: "5", label: "Rounds per Game" },
  { figure: "P2P", label: "Voice Chat" },
];

const statsContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.55 } },
};

const statsChild: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function LandingHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      return;
    }
    video.playbackRate = 0.6;
    void video.play().catch(() => {
      /* autoplay blocked — the ink backdrop still looks right */
    });
  }, []);

  return (
    <section className="relative flex min-h-[100svh] w-full flex-col overflow-hidden bg-[#0A0908]">
      {/* Background video (Kelo reference: slowed to 0.6x under a light tint) */}
      <video
        ref={videoRef}
        className="absolute inset-0 z-0 h-full w-full object-cover"
        src={VIDEO_SRC}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      {/* Fallback glow behind the video while it streams */}
      <div
        aria-hidden
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 38%, rgba(200,162,75,0.16) 0%, rgba(10,9,8,0) 70%)",
        }}
      />
      <div aria-hidden className="absolute inset-0 z-[1] bg-black/20" />
      {/* Depth fade into the ink base */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 z-[2] h-[38%]"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,9,8,0) 0%, rgba(10,9,8,0.82) 100%)",
        }}
      />

      {/* Floating glass navigation pill */}
      <motion.nav
        className="absolute left-0 right-0 top-6 z-50 px-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 p-2 px-4 backdrop-blur-xl">
            <a
              href="#top"
              className="block text-[22px] leading-7 tracking-[0.02em] text-[#F6EFE1]"
              style={fontDisplay}
            >
              1757
            </a>

            {/* Desktop links */}
            <div className="hidden items-center gap-5 md:flex">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="group relative py-1 text-[13px] font-medium text-white/70 hover:text-white"
                  style={fontBody}
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-white transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
            </div>

            {/* Desktop auth */}
            <div className="hidden items-center gap-2 md:flex" style={fontBody}>
              <a
                href="/login"
               
                className="px-2 py-1.5 text-[13px] font-medium text-white/70 hover:text-white"
              >
                Log in
              </a>
              <a
                href="/login"
               
                className="rounded-full bg-white px-4 py-1.5 text-[13px] font-semibold text-black transition-transform duration-300 hover:scale-105 hover:bg-white/90 active:scale-95"
              >
                Enter the Court
              </a>
            </div>

            {/* Mobile hamburger */}
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="flex h-8 w-8 flex-col items-center justify-center gap-[5px] md:hidden"
            >
              <span
                className={`h-[2px] w-5 bg-white transition-all duration-300 ${
                  menuOpen ? "translate-y-[7px] rotate-45" : ""
                }`}
              />
              <span
                className={`h-[2px] w-5 bg-white transition-all duration-300 ${
                  menuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`h-[2px] w-5 bg-white transition-all duration-300 ${
                  menuOpen ? "-translate-y-[7px] -rotate-45" : ""
                }`}
              />
            </button>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {menuOpen ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="mt-2 flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-xl md:hidden"
                style={fontBody}
              >
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-3 py-2 text-[15px] text-white/80 hover:bg-white/10 hover:text-white"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="mt-1 border-t border-white/10 pt-3">
                  <a
                    href="/login"
                   
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-[15px] text-white/80 hover:bg-white/10 hover:text-white"
                  >
                    Log in
                  </a>
                  <a
                    href="/login"
                   
                    onClick={() => setMenuOpen(false)}
                    className="mt-2 block rounded-full bg-white px-5 py-2.5 text-center text-[15px] font-semibold text-black"
                  >
                    Enter the Court
                  </a>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Hero content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-14 pt-[140px] text-center">
        <div className="flex w-full flex-col items-center">
          <motion.p
            className="mb-5 text-[12px] font-medium uppercase tracking-[0.32em] text-[#C8A24B]"
            style={fontBody}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05, ease: "easeOut" }}
          >
            Murshidabad · June 1757
          </motion.p>

          <motion.h1
            className="mb-5 max-w-4xl text-5xl leading-[1.08] tracking-[-0.01em] text-[#F6EFE1] md:text-6xl lg:text-[68px]"
            style={fontDisplay}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            The Nawab&apos;s court
            <br />
            hides a <span className="italic text-[#C8A24B]">traitor.</span>
          </motion.h1>

          <motion.p
            className="mb-8 max-w-[540px] leading-relaxed text-[#F6EFE1]/85 md:text-lg"
            style={fontBody}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            A real-time social-deduction game set on the eve of the Battle of
            Plassey. Every player holds a secret historical role — and most of
            them are lying to you.
          </motion.p>

          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            style={fontBody}
          >
            <div className="flex flex-wrap items-center justify-center gap-3">
              <PillLink href="/login" className="px-7 py-3 text-base">
                Enter the Court
              </PillLink>
              <PillLink
                href="/signup"
                variant="dark"
                className="border-white/20 bg-white/5 px-6 py-3 text-base backdrop-blur-sm"
              >
                Create an Account
              </PillLink>
            </div>
            <span className="text-sm text-white/60">
              No download · Free · Play as a guest
            </span>
          </motion.div>

          {/* Stats strip — echoes the reference logo wall */}
          <motion.div
            className="mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-6"
            style={fontBody}
            variants={statsContainer}
            initial="hidden"
            animate="show"
          >
            {STATS.map((stat) => (
              <motion.div
                key={stat.label}
                variants={statsChild}
                whileHover={{ scale: 1.06 }}
                className="flex items-baseline gap-2.5"
              >
                <span
                  className="text-[26px] leading-none text-[#F6EFE1]"
                  style={fontDisplay}
                >
                  {stat.figure}
                </span>
                <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/55">
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.div
        aria-hidden
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
      >
        <div className="h-10 w-px overflow-hidden bg-white/15">
          <motion.div
            className="h-1/2 w-px bg-[#C8A24B]"
            animate={{ y: [-20, 40] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
}
