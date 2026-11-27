"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

/** Expo-out, the same curve as --ease-out in globals.css. */
const EASE = "expo.out";

let lenis: Lenis | null = null;

/**
 * Site-wide motion, modelled on tabletales.crz.studio: Lenis smooth scrolling synced to
 * GSAP's ticker, plus scroll-triggered reveals — masked headline rise, clip-path image
 * wipes, hairline draws and staggered cards. Skipped entirely for reduced-motion users.
 */
export function Motion() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(2, -10 * t) });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = null;
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    lenis?.scrollTo(0, { immediate: true });
    // Scroll reveals are for the public site; the game screens stay instant and readable.
    if (pathname.startsWith("/room") || pathname.startsWith("/home")) return;

    const ctx = gsap.context(() => {
      const scoped = (sel: string) => gsap.utils.toArray<HTMLElement>(`main ${sel}`);
      const onView = (el: Element) => ({ trigger: el, start: "top 88%", once: true });

      // Headlines rise out of a mask, like lines of type sliding up.
      scoped("section h2, [data-reveal='title']").forEach((el) => {
        if (!el.parentElement?.classList.contains("reveal-mask")) {
          const mask = document.createElement("span");
          mask.className = "reveal-mask";
          el.replaceWith(mask);
          mask.appendChild(el);
        }
        gsap.fromTo(el, { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: EASE, scrollTrigger: onView(el.parentElement!) });
      });

      // Eyebrows and lead paragraphs fade up.
      scoped("section .eyebrow, section h2 + p, [data-reveal='fade']").forEach((el) => {
        gsap.fromTo(el, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: EASE, scrollTrigger: onView(el) });
      });

      // Portraits and artwork wipe open from the bottom edge.
      scoped("section img, [data-reveal='image']").forEach((el) => {
        if (el.closest(".hero")) return;
        gsap.fromTo(
          el,
          { clipPath: "inset(100% 0% 0% 0%)", scale: 1.12 },
          { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 1.3, ease: EASE, scrollTrigger: onView(el) }
        );
      });

      // Card grids arrive in a stagger.
      ScrollTrigger.batch(scoped(".card-lift, [data-reveal='card']"), {
        start: "top 90%",
        once: true,
        onEnter: (batch) =>
          gsap.fromTo(batch, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 1, ease: EASE, stagger: 0.07, overwrite: true }),
      });

      // Hairline rules draw left to right.
      scoped("hr, [data-reveal='rule']").forEach((el) => {
        gsap.fromTo(el, { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 1.2, ease: EASE, scrollTrigger: onView(el) });
      });
    });

    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => ctx.revert();
  }, [pathname]);

  return null;
}
