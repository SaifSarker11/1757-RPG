"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

/**
 * Re-mounts on every navigation. The Nawab-vs-Clive battle painting covers the screen from the
 * very first frame (no empty page beforehand), slowly settles, then wipes up to reveal the page.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bar = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tl = gsap.timeline();
    tl.fromTo(scene.current!.querySelector("img"), { scale: 1.1 }, { scale: 1, duration: 1.6, ease: "expo.out" }, 0)
      .to(scene.current, { clipPath: "inset(0 0 100% 0)", duration: 0.85, ease: "power4.inOut" }, 1.0)
      .set(scene.current, { display: "none" })
      .fromTo(bar.current, { scaleX: 0, autoAlpha: 1 }, { scaleX: 1, duration: 0.6, ease: "expo.inOut" }, 1.2)
      .to(bar.current, { autoAlpha: 0, duration: 0.3 }, ">-0.05")
      .fromTo(
        content.current,
        { y: 28, filter: "blur(10px)" },
        { y: 0, filter: "blur(0px)", duration: 0.9, ease: "expo.out", clearProps: "all" },
        1.2
      );
    return () => { tl.kill(); };
  }, [pathname]);

  return (
    <>
      <link rel="preload" as="image" href="/images/transition-battle.jpg" />
      <div ref={scene} aria-hidden className="page-scene">
        <img src="/images/transition-battle.jpg" alt="" fetchPriority="high" decoding="sync" />
      </div>
      <div ref={bar} aria-hidden className="page-progress" />
      <div ref={content} className="flex flex-1 flex-col">{children}</div>
    </>
  );
}
