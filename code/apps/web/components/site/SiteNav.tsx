"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Seal } from "@/components/brand/Seal";

const LINKS = [
  { href: "/", label: "The Court" },
  { href: "/#how", label: "How to play" },
  { href: "/characters", label: "Characters" },
  { href: "/rules", label: "Rulebook" },
  { href: "/login", label: "Play now" },
];

/** Tabletales-style header: crest on the left, gold burger on the right, full-screen menu. */
export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav
        aria-label="Main"
        className={`relative z-[60] flex items-center justify-between px-6 py-4 transition-colors duration-500 md:px-12 ${
          scrolled && !open ? "bg-base-100/80 backdrop-blur-md" : ""
        }`}
      >
        <Link href="/" aria-label="1757 home" className="text-primary transition-transform duration-700 hover:rotate-45">
          <Seal className="h-12 w-12 md:h-14 md:w-14" />
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/login" className="hidden text-xs uppercase tracking-[0.3em] text-primary hover:opacity-70 sm:inline">
            Play now
          </Link>
          <button
            className="burger -m-3 p-3"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>
      </nav>

      <div
        data-open={open}
        className="menu-panel fixed inset-0 z-[55] flex flex-col justify-center bg-neutral px-6 md:px-12"
        aria-hidden={!open}
      >
        <ul className="flex flex-col gap-1">
          {LINKS.map((l, i) => (
            <li key={l.href} className="overflow-hidden">
              <Link
                href={l.href}
                tabIndex={open ? 0 : -1}
                onClick={() => setOpen(false)}
                style={{ ["--i" as string]: i }}
                className="menu-link group flex items-baseline gap-5 font-display text-5xl font-black uppercase leading-[1.05] md:text-8xl"
              >
                <span className="font-mono text-xs font-normal text-primary">0{i + 1}</span>
                <span className="transition-[letter-spacing,color] duration-700 group-hover:tracking-wider group-hover:text-primary">{l.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="eyebrow mt-12">Bengal · 23 June 1757 · Trust no one at court</p>
      </div>
    </header>
  );
}
