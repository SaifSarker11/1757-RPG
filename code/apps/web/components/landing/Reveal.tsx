"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Stagger delay in ms, applied via transition-delay. */
  delay?: number;
  className?: string;
}

/**
 * Blur-up scroll reveal (PestGuard reference): IntersectionObserver at
 * threshold 0.15, animating opacity / translateY(64px) / scale / blur over
 * 1100ms with a long cubic-bezier ease. Skips the animation entirely when
 * the user prefers reduced motion.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(64px) scale(0.96)",
        filter: visible ? "none" : "blur(12px)",
        transition: visible
          ? "opacity 1100ms, transform 1100ms, filter 1100ms"
          : "none",
        transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
        transitionDelay: `${delay}ms`,
        willChange: "opacity, transform, filter",
      }}
    >
      {children}
    </div>
  );
}
