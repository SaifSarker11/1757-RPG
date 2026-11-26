"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const WORDS = ["Muster", "Council", "Betrayal"];

export function PlasseyPreloader() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Only show once per browser session so returning visitors aren't delayed
    if (typeof window !== "undefined" && sessionStorage.getItem("plassey_entered")) {
      return;
    }
    setVisible(true);

    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 14) + 8;
      if (current >= 100) {
        current = 100;
        setProgress(100);
        setReady(true);
        clearInterval(interval);
      } else {
        setProgress(current);
      }
    }, 65);

    return () => clearInterval(interval);
  }, []);

  const handleEnter = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("plassey_entered", "1");
    }
    setVisible(false);
  };

  const wordIndex = progress < 34 ? 0 : progress < 72 ? 1 : 2;
  const padded = String(progress).padStart(3, "0");

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }}
          className="fixed inset-0 z-[300] flex flex-col items-center justify-between bg-[#0f0b08] text-[#f2ece1] px-6 py-10 select-none"
        >
          {/* Top historical stamp */}
          <div className="text-[11px] font-mono uppercase tracking-[0.28em] text-[#c8a252]/80">
            Bengal · June 1757
          </div>

          {/* Center thin brass frame */}
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="relative border border-[#c8a252]/35 px-10 py-8 md:px-16 md:py-12">
              <span className="block text-[10px] font-mono uppercase tracking-[0.26em] text-[#9e9587] mb-3">
                The Battle of Plassey
              </span>
              <h1 className="font-serif text-4xl md:text-6xl font-semibold tracking-tight text-[#f2ece1]">
                1757
              </h1>
            </div>

            {ready ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <button
                  type="button"
                  onClick={handleEnter}
                  className="px-8 py-2.5 border border-[#c8a252] bg-[#c8a252]/10 text-[#f2ece1] text-xs font-mono uppercase tracking-[0.25em] hover:bg-[#c8a252] hover:text-[#0f0b08] transition-all cursor-pointer"
                >
                  Enter the Court
                </button>
                <span className="text-[11px] text-[#9e9587] tracking-wide">
                  Best on a large screen. Scroll slowly.
                </span>
              </motion.div>
            ) : (
              <div className="h-[68px]" />
            )}
          </div>

          {/* Bottom 3-digit counter & phase word */}
          <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-[0.22em] text-[#9e9587]">
            <span className="text-[#c8a252] tabular-nums">{padded}</span>
            <span className="h-3 w-px bg-[#c8a252]/30" />
            <span>{WORDS[wordIndex]}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
