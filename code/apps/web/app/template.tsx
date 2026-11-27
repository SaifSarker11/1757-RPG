"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Re-mounts on every navigation. A curtain lifts off the new page (clip-path wipe upward)
 * while the content settles in — the page transition style of tabletales.crz.studio.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const curtain = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (curtain.current) curtain.current.style.display = "none";
      return;
    }
    const tl = gsap.timeline({ defaults: { ease: "expo.inOut" } });
    tl.fromTo(curtain.current, { clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.9 })
      .fromTo(content.current, { y: 40, autoAlpha: 0.4 }, { y: 0, autoAlpha: 1, duration: 1, ease: "expo.out", clearProps: "transform,opacity,visibility" }, 0.25);
    return () => {
      tl.kill();
    };
  }, []);

  return (
    <>
      <div ref={curtain} aria-hidden className="page-curtain">
        <span className="font-display">1757</span>
      </div>
      <div ref={content} className="flex flex-1 flex-col">{children}</div>
    </>
  );
}
