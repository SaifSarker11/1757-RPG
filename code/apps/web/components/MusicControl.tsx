"use client";

import { gameAudio } from "@/lib/audio";
import { MUSIC_LICENSE, TRACKS, musicPlayer, useMusic } from "@/lib/music";

/** Navbar music menu: pick a track or turn music off, set the volume. */
export function MusicControl() {
  const music = useMusic();
  const current = TRACKS.find((t) => t.id === music.trackId);

  const label = !current
    ? "MUSIC: OFF 🔇"
    : music.suppressed
      ? "MUSIC: PAUSED ⏸"
      : music.awaitingGesture
        ? "MUSIC: CLICK ▶"
        : "MUSIC: ON 🎵";

  const choose = (trackId: string | null) => {
    gameAudio.playClick();
    musicPlayer.setTrack(trackId);
  };

  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        title={current ? `Now playing: ${current.name}` : "Background music is off"}
        className={`btn btn-sm btn-outline rounded-none border-2 font-pixel ${
          current && !music.suppressed ? "btn-accent text-accent-content" : ""
        }`}
      >
        {label}
      </div>
      <div
        tabIndex={0}
        className="dropdown-content bg-base-100 rounded-none z-20 w-64 p-3 shadow-lg border-2 border-base-300 font-pixel space-y-2"
      >
        <span className="text-[9px] uppercase text-base-content/60 block">Background music</span>
        <ul className="menu p-0 gap-0.5">
          <li>
            <button
              onClick={() => choose(null)}
              className={`rounded-none text-[10px] ${!current ? "active" : ""}`}
            >
              🔇 Off
            </button>
          </li>
          {TRACKS.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => choose(t.id)}
                className={`rounded-none text-[10px] flex justify-between ${t.id === music.trackId ? "active" : ""}`}
              >
                <span>🎵 {t.name}</span>
                {t.id === music.trackId && music.playing && <span className="animate-pulse">▶</span>}
              </button>
            </li>
          ))}
        </ul>

        <label className="flex items-center gap-2 text-[9px] uppercase">
          Vol
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={music.volume}
            onChange={(e) => musicPlayer.setVolume(Number(e.target.value))}
            className="range range-xs range-accent flex-1"
            aria-label="Music volume"
          />
        </label>

        {music.suppressed && current && (
          <p className="text-[9px] text-warning leading-snug">
            Paused while voice chat is active. It resumes when the voice channel empties.
          </p>
        )}

        {current && (
          <p className="font-sans text-[9px] text-base-content/60 leading-snug border-t border-dashed border-base-content/20 pt-1.5">
            “{current.title}” by {current.artist},{" "}
            <a href={MUSIC_LICENSE.url} target="_blank" rel="noreferrer" className="link">
              {MUSIC_LICENSE.name}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
