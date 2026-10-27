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
    <div className="flex-1 flex flex-col justify-between overflow-hidden font-pixel">
      <div className="flex-1 overflow-y-auto pr-1 space-y-1.5">
        {participants.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center opacity-60 gap-1">
            <span className="text-2xl">🎙️</span>
            <span className="text-[9px]">The war tent is silent.</span>
            <span className="text-[9px]">Join to talk with the council.</span>
          </div>
        ) : (
          participants.map((p) => {
            const me = p.socketId === mySocketId;
            const talking = !p.muted && voice.isSpeaking(p.socketId);
            return (
              <div
                key={p.socketId}
                className={`flex items-center gap-2 px-2 py-1.5 border-2 transition-colors ${
                  talking ? "border-success bg-success/10" : "border-base-content/10 bg-base-200"
                }`}
              >
                <span
                  aria-hidden
                  className={`w-2.5 h-2.5 rounded-full ${talking ? "bg-success animate-pulse" : "bg-base-content/25"}`}
                />
                <span className="flex-1 truncate text-[10px] uppercase">
                  {playerNames[p.userId] ?? `Player ${p.userId.slice(-4)}`}
                  {me && <span className="text-base-content/50"> (you)</span>}
                </span>
                <span className="text-xs" title={p.muted ? "Muted" : "Mic on"}>
                  {p.muted ? "🔇" : "🎙️"}
                </span>
              </div>
            );
          })
        )}
      </div>

      {error && (
        <div className="alert alert-warning rounded-none border-2 py-1 px-2 text-[9px] mt-2">
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-2 pt-2 mt-2 border-t border-dashed border-base-content/20">
        {joined ? (
          <>
            <button
              onClick={() => {
                gameAudio.playClick();
                voice.toggleMute();
              }}
              className={`btn btn-xs flex-1 rounded-none border-2 font-pixel ${muted ? "btn-warning" : "btn-outline"}`}
            >
              {muted ? "UNMUTE 🔇" : "MUTE 🎙️"}
            </button>
            <button
              onClick={() => {
                gameAudio.playClick();
                voice.leave();
              }}
              className="btn btn-xs btn-error flex-1 rounded-none border-2 font-pixel"
            >
              LEAVE VOICE
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              gameAudio.playClick();
              void voice.join();
            }}
            disabled={joining}
            className="btn btn-xs btn-success w-full rounded-none border-2 font-pixel"
          >
            {joining ? "CONNECTING..." : `JOIN VOICE${participants.length ? ` (${participants.length})` : ""}`}
          </button>
        )}
      </div>
    </div>
  );
}
