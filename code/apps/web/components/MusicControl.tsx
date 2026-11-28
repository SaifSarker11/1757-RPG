"use client";
import { useRef } from "react";
import { TRACKS, musicPlayer, useMusic } from "@/lib/music";

export function MusicControl() {
  const music = useMusic();
  const dialog = useRef<HTMLDialogElement>(null);
  const open = () => dialog.current?.showModal();
  const current = TRACKS.find((track) => track.id === music.trackId);
  return <>
    <button type="button" onClick={open} className="btn btn-sm btn-outline font-mono" aria-label="Music settings" title="Background music">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M9 18V5l12-2v13M9 8l12-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="18" cy="16" rx="3" ry="2"/></svg>
      <span>{music.awaitingGesture ? "Enable music" : "Music"}</span>
    </button>
    <dialog ref={dialog} className="modal sound-dialog" aria-labelledby="music-title" onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <div className="modal-box preference-panel">
        <div className="flex items-center justify-between gap-4 mb-5"><h2 id="music-title" className="font-display text-2xl">Music &amp; atmosphere</h2><button type="button" className="btn btn-ghost btn-square btn-sm" onClick={() => dialog.current?.close()} aria-label="Close music settings">×</button></div>
        <label className="block font-mono text-xs mb-2" htmlFor="music-track">Background music</label>
        <select id="music-track" className="select select-bordered w-full" value={music.trackId ?? "off"} onChange={(event) => musicPlayer.setTrack(event.target.value === "off" ? null : event.target.value)}>
          <option value="off">Off</option>{TRACKS.map((track) => <option key={track.id} value={track.id}>{track.name}</option>)}
        </select>
        {current && <div className="flex items-center justify-between gap-3 mt-3"><span className="text-xs text-base-content/70">{current.title}</span><button type="button" className="btn btn-sm btn-ghost" onClick={() => music.playing ? musicPlayer.setTrack(null) : musicPlayer.resume()} aria-label={music.playing ? "Stop music" : "Play music"}>{music.playing ? "Ⅱ" : "▶"}</button></div>}
        {music.error && <p role="alert" className="text-sm mt-2">{music.error}</p>}
        {music.suppressed && <p className="text-xs mt-2">Music paused for voice chat.</p>}
        <label className="flex items-center gap-3 mt-4 text-xs">Music volume<input type="range" className="range range-xs range-primary flex-1" min="0" max="1" step="0.05" value={music.volume} onChange={(event) => musicPlayer.setVolume(Number(event.target.value))} aria-label="Music volume"/><output>{Math.round(music.volume * 100)}%</output></label>
      </div>
    </dialog>
  </>;
}
