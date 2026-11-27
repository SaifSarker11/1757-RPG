"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/#how", label: "How to play" },
  { href: "/characters", label: "Characters" },
  { href: "/rules", label: "Rules" },
];

export function SiteNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <nav
        className={`flex w-full max-w-5xl items-center justify-between rounded-full px-3 py-2 transition-all duration-500 ${
          scrolled ? "frost shadow-2xl" : "border border-transparent"
        }`}
        aria-label="Main"
      >
        <Link href="/" className="flex items-center gap-2 pl-3">
          <span className="font-display text-2xl font-semibold tracking-tight">1757</span>
          <span className="hidden text-[10px] uppercase tracking-[0.3em] opacity-50 sm:inline">Plassey</span>
        </Link>
        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`rounded-full px-4 py-2 text-sm transition-colors hover:bg-base-content/10 ${
                  pathname === l.href ? "bg-base-content/10" : "opacity-75 hover:opacity-100"
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden rounded-full px-4 py-2 text-sm opacity-75 hover:opacity-100 sm:inline">
            Sign in
          </Link>
          <Link href="/login" className="btn btn-primary btn-sm rounded-full px-5">
            Play now
          </Link>
          <button
            className="btn btn-ghost btn-sm btn-circle md:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="text-lg">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </nav>
      {open && (
        <div className="frost absolute inset-x-4 top-20 rounded-3xl p-3 md:hidden">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 hover:bg-base-content/10">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
