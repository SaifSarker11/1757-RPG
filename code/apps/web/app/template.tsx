"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

/** In-game screens (lobby through the end of a match) use the Prägen Hätlen-style veil. */
const isGame = (p: string) => p.startsWith("/home") || p.startsWith("/room");

/**
 * Re-mounts on every navigation, on every page.
 * - Public pages: the battle painting holds for a beat, lifts away, and the page rises out of a blur.
 * - Game pages: a dark-red veil with a bracketed mono counter [000]→[100], a gradient hairline,
 *   then the veil wipes up and the content resolves from blur.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const game = isGame(pathname);
  const bar = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tl = gsap.timeline();
    tl.set(content.current, { autoAlpha: 0 });
    if (game) {
      const n = { v: 0 };
      tl.to(n, {
        v: 100, duration: 0.9, ease: "power2.inOut",
        onUpdate: () => { if (count.current) count.current.textContent = String(Math.round(n.v)).padStart(3, "0"); },
      }, 0)
        .fromTo(veil.current!.querySelector(".pg-line"), { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: "power2.inOut" }, 0)
        .to(veil.current, { clipPath: "inset(0 0 100% 0)", duration: 0.75, ease: "expo.inOut" }, 0.95)
        .set(veil.current, { display: "none" })
        .addLabel("land", 1.1);
    } else {
      tl.fromTo(scene.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, 0)
        .fromTo(scene.current!.querySelector("img"), { scale: 1.08 }, { scale: 1, duration: 1.3, ease: "expo.out" }, 0)
        .to(scene.current, { clipPath: "inset(0 0 100% 0)", duration: 0.8, ease: "expo.inOut" }, 0.9)
        .set(scene.current, { display: "none" })
        .addLabel("land", 1.25);
      tl.fromTo(bar.current, { scaleX: 0, autoAlpha: 1 }, { scaleX: 1, duration: 0.7, ease: "expo.inOut" }, "land")
        .to(bar.current, { autoAlpha: 0, duration: 0.3 }, ">-0.05");
    }
    tl.fromTo(
      content.current,
      { autoAlpha: 0, y: game ? 0 : 28, scale: game ? 1.02 : 1, filter: "blur(12px)" },
      { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.9, ease: "expo.out", clearProps: "all" },
      "land+=0.1"
    );
    return () => { tl.kill(); };
  }, [game]);

  return (
    <>
      {game ? (
        <div ref={veil} aria-hidden className="pg-veil">
          <div className="flex flex-col items-center gap-3">
            <span className="font-display text-5xl font-black text-primary">1757</span>
            <span className="pg-count">[<span ref={count}>000</span>]</span>
          </div>
          <div className="pg-line" />
        </div>
      ) : (
        <>
          <div ref={scene} aria-hidden className="page-scene"><img src="/images/transition-battle.jpg" alt="" /></div>
          <div ref={bar} aria-hidden className="page-progress" />
        </>
      )}
      <div ref={content} className="flex flex-1 flex-col">{children}</div>
    </>
  );
}
