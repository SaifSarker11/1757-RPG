"use client";

import { gameAudio } from "@/lib/audio";
import type { useVoiceChat } from "@/lib/useVoiceChat";

interface Props {
  voice: ReturnType<typeof useVoiceChat>;
  playerNames: Record<string, string>;
}

/** The "Voice" tab: join/leave the room's voice channel and see who's talking. */
export function VoiceChatPanel({ voice, playerNames }: Props) {
  const { participants, joined, joining, muted, error, mySocketId } = voice;

  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden">
      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {participants.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-[#9E9587] gap-1.5 py-6">
            <span className="text-xs font-medium text-[#F2ECE1]/70">The war tent is silent.</span>
            <span className="text-[11px] text-[#9E9587]">Join voice to speak with the council.</span>
          </div>
        ) : (
          participants.map((p) => {
            const me = p.socketId === mySocketId;
            const talking = !p.muted && voice.isSpeaking(p.socketId);
            return (
              <div
                key={p.socketId}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-colors ${
                  talking
                    ? "border-emerald-500/50 bg-emerald-950/30"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <span
                  aria-hidden
                  className={`w-2 h-2 rounded-full ${
                    talking ? "bg-emerald-400 animate-pulse" : "bg-white/25"
                  }`}
                />
                <span className="flex-1 truncate text-xs font-medium text-[#F2ECE1]">
                  {playerNames[p.userId] ?? `Player ${p.userId.slice(-4)}`}
                  {me && <span className="text-[#9E9587] font-normal"> (you)</span>}
                </span>
                <span className="text-[10px] font-mono-code uppercase text-[#9E9587]">
                  {p.muted ? "Muted" : "Live"}
                </span>
              </div>
            );
          })
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-950/40 px-3 py-1.5 text-[11px] text-amber-200 mt-2">
          {error}
        </div>
      )}

      <div className="flex gap-2 pt-3 mt-2 border-t border-white/10">
        {joined ? (
          <>
            <button
              onClick={() => {
                gameAudio.playClick();
                voice.toggleMute();
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                muted
                  ? "border-amber-500/50 bg-amber-950/40 text-amber-200"
                  : "border-white/15 bg-white/5 text-[#F2ECE1] hover:bg-white/10"
              }`}
            >
              {muted ? "Unmute" : "Mute"}
            </button>
            <button
              onClick={() => {
                gameAudio.playClick();
                voice.leave();
              }}
              className="flex-1 py-2 rounded-xl text-xs font-medium border border-red-500/40 bg-red-950/40 text-red-200 hover:bg-red-900/50 transition-all cursor-pointer"
            >
              Leave Voice
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              gameAudio.playClick();
              void voice.join();
            }}
            disabled={joining}
            className="w-full py-2 rounded-xl text-xs font-semibold uppercase tracking-wider bg-emerald-600/80 hover:bg-emerald-600 text-white transition-all cursor-pointer disabled:opacity-50"
          >
            {joining ? "Connecting..." : `Join Voice${participants.length ? ` (${participants.length})` : ""}`}
          </button>
        )}
      </div>
    </div>
  );
}
