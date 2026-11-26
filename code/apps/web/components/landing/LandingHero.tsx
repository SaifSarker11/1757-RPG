"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PillLink } from "./PillLink";
import { fontMono, fontSans, ui } from "./fonts";

const NAV_LINKS = [
  { label: "How to Play", href: "#how" },
  { label: "The Factions", href: "#factions" },
  { label: "The Roles", href: "#roles" },
];

const VIDEO_SRC = "https://cdn.jiro.build/Kelo/Hero%2003.mp4";

const HERO_CHIPS = ["Murshidabad · June 1757", "6–15 players", "Free to play"];

const META = [
  { figure: "17", label: "Secret roles" },
  { figure: "05", label: "Rounds per game" },
  { figure: "6–15", label: "Players" },
  { figure: "P2P", label: "Voice chat" },
];

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
      /* autoplay blocked — the poster frame still looks right */
    });
  }, []);

  return (
    <section className="relative w-full">
      {/* Top bar — Supply marketplace header: hairline bottom border on canvas */}
      <motion.header
        className="sticky top-0 z-40 border-b border-[#e6e6e4] bg-[#ececeb]/85 backdrop-blur-md"
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <a
            href="#top"
            className="flex items-baseline gap-2 text-[17px] font-semibold tracking-[-0.02em] text-[#111]"
            style={fontSans}
          >
            1757
            <span
              className="hidden text-[10px] font-medium uppercase tracking-[0.22em] text-[#8a8a8a] sm:inline"
              style={fontMono}
            >
              Plassey
            </span>
          </a>

          {/* Desktop links */}
          <nav
            className="hidden items-center gap-6 md:flex"
            style={fontSans}
            aria-label="Sections"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[13px] font-medium text-[#5c5c5c] transition-colors duration-200 hover:text-[#111]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop auth */}
          <div className="hidden items-center gap-2 md:flex" style={fontSans}>
            <a
              href="/login"
              className="px-3 py-1.5 text-[13px] font-medium text-[#5c5c5c] transition-colors duration-200 hover:text-[#111]"
            >
              Sign in
            </a>
            <PillLink href="/login" className="px-4 py-2 text-[13px]">
              Enter the Court
            </PillLink>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] rounded-full border border-[#e6e6e4] bg-white md:hidden"
          >
            <span
              className={`h-[2px] w-4 bg-[#111] transition-all duration-300 ${
                menuOpen ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`h-[2px] w-4 bg-[#111] transition-all duration-300 ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`h-[2px] w-4 bg-[#111] transition-all duration-300 ${
                menuOpen ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>

        {/* Mobile menu — white card panel */}
        <AnimatePresence>
          {menuOpen ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="mx-6 mb-3 flex flex-col gap-1 rounded-[18px] border border-[#e6e6e4] bg-white p-3 shadow-[0_6px_14px_-6px_rgba(0,0,0,0.16)] md:hidden"
              style={fontSans}
            >
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-[12px] px-3 py-2.5 text-[14px] font-medium text-[#111] transition-colors hover:bg-[#f4f4f3]"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-1 border-t border-[#e6e6e4] pt-3">
                <a
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-[12px] px-3 py-2.5 text-[14px] font-medium text-[#5c5c5c] transition-colors hover:bg-[#f4f4f3]"
                >
                  Sign in
                </a>
                <a
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="mt-1 block rounded-full bg-[#ff5206] px-5 py-2.5 text-center text-[14px] font-medium text-white transition-colors hover:bg-[#e84700]"
                >
                  Enter the Court
                </a>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.header>

      {/* Hero — Supply product hero: chips, tight display type, CTA row */}
      <div className="relative mx-auto max-w-6xl px-6 pb-14 pt-16 text-center md:pt-24">
        <motion.div
          className="mb-7 flex flex-wrap items-center justify-center gap-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: "easeOut" }}
          style={fontSans}
        >
          {HERO_CHIPS.map((chip) => (
            <span
              key={chip}
              className={ui.chip}
              style={fontMono}
            >
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#ff5206]" />
              {chip}
            </span>
          ))}
        </motion.div>

        <motion.h1
          className="mx-auto max-w-4xl text-[44px] font-medium leading-[1.04] tracking-[-0.03em] text-[#111] md:text-[64px] lg:text-[76px]"
          style={fontSans}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.12, ease: "easeOut" }}
        >
          The Nawab&apos;s court hides a{" "}
          <span className="text-[#ff5206]">traitor.</span>
        </motion.h1>

        <motion.p
          className="mx-auto mt-6 max-w-[560px] text-[16px] font-light leading-relaxed text-[#5c5c5c] md:text-[17px]"
          style={fontSans}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        >
          A real-time social-deduction game set on the eve of the Battle of
          Plassey. Every player holds a secret historical role — and most of
          them are lying to you.
        </motion.p>

        <motion.div
          className="mt-9 flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28, ease: "easeOut" }}
          style={fontSans}
        >
          <div className="flex flex-wrap items-center justify-center gap-3">
            <PillLink href="/login" className="px-7 py-3 text-[15px]">
              Enter the Court
            </PillLink>
            <PillLink
              href="/signup"
              variant="surface"
              className="px-6 py-3 text-[15px]"
            >
              Create an Account
            </PillLink>
          </div>
          <span
            className="text-[11px] uppercase tracking-[0.14em] text-[#8a8a8a]"
            style={fontMono}
          >
            No download · Play as a guest · Voice chat built in
          </span>
        </motion.div>
      </div>

      {/* Preview card — Supply template-card framing around the table video */}
      <motion.div
        className="mx-auto max-w-5xl px-6 pb-16"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
      >
        <div className="rounded-[20px] border border-[#e6e6e4] bg-white p-2 shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.04),0_24px_48px_-28px_rgba(0,0,0,0.22)]">
          <div className="relative overflow-hidden rounded-[14px] bg-[#111]">
            <video
              ref={videoRef}
              className="aspect-video w-full object-cover"
              src={VIDEO_SRC}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            />
          </div>
          <div
            className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5"
            style={fontSans}
          >
            <span
              className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#8a8a8a]"
              style={fontMono}
            >
              The court in session — live table
            </span>
            <span className="flex flex-wrap items-center gap-2">
              <span className={ui.chip} style={fontMono}>
                5 rounds
              </span>
              <span className={ui.chip} style={fontMono}>
                Secret roles
              </span>
            </span>
          </div>
        </div>
      </motion.div>

      {/* Meta strip — Supply footer meta rhythm */}
      <motion.div
        className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6 pb-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.55, ease: "easeOut" }}
        style={fontSans}
      >
        {META.map((stat) => (
          <span key={stat.label} className="flex items-baseline gap-2.5">
            <span
              className="text-[18px] font-medium tracking-[-0.02em] text-[#111]"
              style={fontSans}
            >
              {stat.figure}
            </span>
            <span
              className="text-[10px] uppercase tracking-[0.18em] text-[#8a8a8a]"
              style={fontMono}
            >
              {stat.label}
            </span>
          </span>
        ))}
      </motion.div>
    </section>
  );
}
