"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { nextTransitionScene } from "@/lib/transition-player";

/**
 * Each navigation draws from a shuffled gallery, preserving the cycle across reloads.
 * Never cover the page until the selected image has loaded; failed media cannot leave a blank veil.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bar = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement>(null);

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const chosen = nextTransitionScene();
    const element = scene.current; const picture = image.current;
    if (!chosen || !element || !picture) return;
    let timeline: gsap.core.Timeline | null = null;
    let active = true;
    const play = () => {
      if (!active || !picture.naturalWidth || timeline) return;
      element.style.visibility = 'visible';
      timeline = gsap.timeline();
      timeline.fromTo(picture, { scale: 1.06 }, { scale: 1, duration: 1.4, ease: "expo.out" }, 0)
      .to(element, { clipPath: "inset(0 0 100% 0)", duration: 0.8, ease: "power4.inOut" }, 0.75)
      .set(element, { visibility: "hidden" })
      .fromTo(bar.current, { scaleX: 0, autoAlpha: 1 }, { scaleX: 1, duration: 0.6, ease: "expo.inOut" }, 1.2)
      .to(bar.current, { autoAlpha: 0, duration: 0.3 }, ">-0.05")
      .fromTo(
        content.current,
        { y: 28, filter: "blur(10px)" },
        { y: 0, filter: "blur(0px)", duration: 0.9, ease: "expo.out", clearProps: "all" },
        1.2
      );
    };
    picture.onload = play;
    picture.onerror = () => { element.style.visibility = 'hidden'; };
    element.dataset['sceneId'] = chosen.id;
    picture.src = chosen.src;
    if (picture.complete) play();
    const deadline = window.setTimeout(() => { if (!timeline) { active = false; element.style.visibility = 'hidden'; } }, 1800);
    return () => { active = false; window.clearTimeout(deadline); picture.onload = null; picture.onerror = null; timeline?.kill(); };
  }, [pathname]);

  return (
    <>
      <div ref={scene} aria-hidden className="page-scene">
        <img ref={image} alt="" fetchPriority="high" decoding="sync" />
      </div>
      <div ref={bar} aria-hidden className="page-progress" />
      <div ref={content} className="flex flex-1 flex-col">{children}</div>
    </>
  );
}
