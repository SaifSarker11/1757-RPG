"use client";
import { useEffect, useRef, useState } from "react";
import { gameAudio } from "@/lib/audio";
import { TRACKS, musicPlayer, useMusic } from "@/lib/music";
import { CLICK_SOUNDS, type ClickSoundId } from "@/lib/preferences";

export function MusicControl() {
  const music = useMusic();
  const dialog = useRef<HTMLDialogElement>(null);
  const [enabled, setEnabled] = useState(true);
  const [sound, setSound] = useState<ClickSoundId>("whisper");
  const [volume, setVolume] = useState(0.35);
  useEffect(() => { setEnabled(gameAudio.isEnabled()); setSound(gameAudio.getSound()); setVolume(gameAudio.getVolume()); }, []);
  const open = () => { setEnabled(gameAudio.isEnabled()); setSound(gameAudio.getSound()); setVolume(gameAudio.getVolume()); dialog.current?.showModal(); };
  const current = TRACKS.find((track) => track.id === music.trackId);
  return <>
    <button type="button" onClick={open} className="btn btn-sm btn-outline font-mono" aria-label="Sound settings" title="Music and click sounds">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M9 18V5l12-2v13M9 8l12-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="18" cy="16" rx="3" ry="2"/></svg>
      <span>{music.awaitingGesture ? "Enable music" : "Music & sound"}</span>
    </button>
    <dialog ref={dialog} className="modal sound-dialog" aria-labelledby="sound-title" onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <div className="modal-box preference-panel">
        <div className="flex items-center justify-between gap-4 mb-5"><h2 id="sound-title" className="font-display text-2xl">Sound & atmosphere</h2><button type="button" className="btn btn-ghost btn-square btn-sm" onClick={() => dialog.current?.close()} aria-label="Close sound settings">×</button></div>
        <label className="block font-mono text-xs mb-2" htmlFor="music-track">Background music</label>
        <select id="music-track" className="select select-bordered w-full" value={music.trackId ?? "off"} onChange={(event) => musicPlayer.setTrack(event.target.value === "off" ? null : event.target.value)}>
          <option value="off">Off</option>{TRACKS.map((track) => <option key={track.id} value={track.id}>{track.name}</option>)}
        </select>
        {current && <div className="flex items-center justify-between gap-3 mt-3"><span className="text-xs text-base-content/70">{current.title}</span><button type="button" className="btn btn-sm btn-ghost" onClick={() => music.playing ? musicPlayer.setTrack(null) : musicPlayer.resume()} aria-label={music.playing ? "Stop music" : "Play music"}>{music.playing ? "Ⅱ" : "▶"}</button></div>}
        {music.error && <p role="alert" className="text-sm mt-2">{music.error}</p>}
        {music.suppressed && <p className="text-xs mt-2">Music paused for voice chat.</p>}
        <label className="flex items-center gap-3 my-4 text-xs">Music volume<input type="range" className="range range-xs range-primary flex-1" min="0" max="1" step="0.05" value={music.volume} onChange={(event) => musicPlayer.setVolume(Number(event.target.value))} aria-label="Music volume"/><output>{Math.round(music.volume * 100)}%</output></label>
        <div className="border-t border-base-content/20 pt-4 mt-4">
          <label className="flex items-center justify-between gap-3 text-sm mb-4">Click sounds<input type="checkbox" className="toggle toggle-primary" checked={enabled} onChange={(event) => { gameAudio.setEnabled(event.target.checked); setEnabled(event.target.checked); }} /></label>
          <div role="radiogroup" aria-label="Click sound" className="space-y-2">{CLICK_SOUNDS.map((option) => <div key={option.id} className="flex items-center gap-2">
            <button type="button" data-sfx="off" role="radio" aria-checked={sound === option.id} className={`btn btn-sm flex-1 justify-start ${sound === option.id ? "btn-primary" : "btn-outline"}`} onClick={() => { gameAudio.setSound(option.id); setSound(option.id); if (enabled) gameAudio.preview(option.id); }}><span aria-hidden="true">{sound === option.id ? "●" : "○"}</span>{option.name}</button>
            <button type="button" data-sfx="off" className="btn btn-sm btn-ghost btn-square" disabled={!enabled} onClick={() => gameAudio.preview(option.id)} aria-label={`Preview ${option.name}`} title={`Preview ${option.name}`}>▶</button>
          </div>)}</div>
          <label className="flex items-center gap-3 mt-4 text-xs">Click volume<input type="range" className="range range-xs range-primary flex-1" min="0" max="1" step="0.05" value={volume} onChange={(event) => { const value = Number(event.target.value); gameAudio.setVolume(value); setVolume(value); }} aria-label="Click volume"/><output>{Math.round(volume * 100)}%</output></label>
        </div>
      </div>
    </dialog>
  </>;
}
