// apps/web/components/InfoModal.tsx
"use client";

import { useEffect } from "react";
import { gameAudio } from "@/lib/audio";

interface RoleInfo {
  name: string;
  team: string;
  power: string;
}

interface InfoModalProps {
  open: boolean;
  onClose: () => void;
  roles: RoleInfo[];
}

export default function InfoModal({ open, onClose, roles }: InfoModalProps) {
  // Play opening/closing sounds
  useEffect(() => {
    if (open) {
      gameAudio.playClick();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      <div className="council-panel rounded-2xl p-6 max-w-lg w-full">
        <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
          <h2 className="font-display text-2xl font-bold text-[#F2ECE1]">
            Council Reference
          </h2>
          <button
            onClick={() => {
              gameAudio.playClick();
              onClose();
            }}
            className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 text-[#9E9587] hover:text-[#F2ECE1] flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="space-y-5 max-h-96 overflow-y-auto pr-1">
          <section>
            <h3 className="text-[11px] font-mono-code uppercase tracking-[0.2em] text-[#C8A252] mb-2.5">
              Roles in Play
            </h3>
            <ul className="space-y-2.5">
              {roles.map((r) => (
                <li key={r.name} className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#F2ECE1]">{r.name}</span>
                    <span className="text-[10px] font-mono-code uppercase text-[#9E9587]">{r.team}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#9E9587] leading-relaxed">{r.power}</p>
                </li>
              ))}
            </ul>
          </section>
          <section className="border-t border-white/10 pt-3">
            <h3 className="text-[11px] font-mono-code uppercase tracking-[0.2em] text-[#9E9587] mb-2">
              Audio &amp; Theme
            </h3>
            <div className="flex gap-4 text-xs text-[#F2ECE1]/80">
              <span>SFX: {gameAudio.isEnabled() ? "On" : "Off"}</span>
              <span>Theme: {localStorage.getItem("daisyui-theme") ?? "dark"}</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
