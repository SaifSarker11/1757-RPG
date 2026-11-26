"use client";

import { useEffect, useState } from "react";

export function PlasseyCursor() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    // Only enable on fine-pointer (mouse) devices
    if (typeof window === "undefined" || !window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    const onMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest("a, button, [role='button'], input, select");
        setIsPointer(Boolean(interactive));
      }
    };

    const onLeave = () => setPos(null);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  if (!pos) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[250] hidden md:block"
    >
      {/* Outer ring */}
      <div
        className="fixed top-0 left-0 rounded-full border border-[#c8a252]/60 transition-transform duration-150 ease-out"
        style={{
          width: isPointer ? 34 : 24,
          height: isPointer ? 34 : 24,
          transform: `translate3d(${pos.x - (isPointer ? 17 : 12)}px, ${pos.y - (isPointer ? 17 : 12)}px, 0)`,
        }}
      />
      {/* Center dot */}
      <div
        className="fixed top-0 left-0 h-1.5 w-1.5 rounded-full bg-[#c8a252]"
        style={{
          transform: `translate3d(${pos.x - 3}px, ${pos.y - 3}px, 0)`,
        }}
      />
    </div>
  );
}
