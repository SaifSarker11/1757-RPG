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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200] pixel-modal">
      <div className="bg-base-200 border-4 border-primary p-6 max-w-lg w-full pixel-card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-historical font-extrabold text-primary uppercase tracking-wider">
            Game Info
          </h2>
          <button
            onClick={() => {
              gameAudio.playClick();
              onClose();
            }}
            className="btn btn-sm btn-circle btn-ghost font-pixel"
          >
            ✕
          </button>
        </div>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <section>
            <h3 className="text-lg font-pixel font-bold text-secondary mb-2">Roles in Play</h3>
            <ul className="list-disc list-inside space-y-1">
              {roles.map((r) => (
                <li key={r.name} className="text-sm">
                  <span className="font-pixel font-bold">{r.name}</span> –
                  <span className="ml-1 capitalize">{r.team} Team</span>
                  <p className="ml-4 text-xs italic text-base-content/70">{r.power}</p>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h3 className="text-lg font-pixel font-bold text-secondary mb-2">Settings</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Sound Effects: {gameAudio.isEnabled() ? "ON" : "OFF"}</li>
              <li>Theme: {localStorage.getItem("daisyui-theme") ?? "retro"}</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
