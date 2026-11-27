"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

/** The landing page and the sign-in screens load plainly, with no page transition. */
const PLAIN = new Set(["/", "/login", "/signup"]);

/**
 * Re-mounts on every navigation. Every page except the landing and sign-in screens
 * gets a contentarchitecture.dev-style entrance: a hairline progress bar runs across
 * the top while the page rises out of a soft blur into place.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const plain = PLAIN.has(pathname);
  const bar = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (plain || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tl = gsap.timeline();
    tl.fromTo(bar.current, { scaleX: 0, autoAlpha: 1 }, { scaleX: 1, duration: 0.7, ease: "expo.inOut" })
      .to(bar.current, { autoAlpha: 0, duration: 0.3 }, ">-0.05")
      .fromTo(
        content.current,
        { autoAlpha: 0, y: 28, filter: "blur(10px)" },
        { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.9, ease: "expo.out", clearProps: "all" },
        0.15
      );
    return () => {
      tl.kill();
    };
  }, [plain]);

  if (plain) return <>{children}</>;
  return (
    <>
      <div ref={bar} aria-hidden className="page-progress" />
      <div ref={content} className="flex flex-1 flex-col">{children}</div>
    </>
  );
}
