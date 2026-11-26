"use client";

import { gameAudio } from "@/lib/audio";
import { MUSIC_LICENSE, TRACKS, musicPlayer, useMusic } from "@/lib/music";

/** Navbar music menu: pick a track or turn music off, set the volume. */
export function MusicControl() {
  const music = useMusic();
  const current = TRACKS.find((t) => t.id === music.trackId);

  const label = !current
    ? "Music Off"
    : music.suppressed
      ? "Music Paused"
      : music.awaitingGesture
        ? "Play Music"
        : "Music On";

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
        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
          current && !music.suppressed
            ? "border-[#C8A252]/50 bg-[#C8A252]/15 text-[#F2ECE1]"
            : "border-white/10 bg-white/5 text-[#9E9587] hover:text-[#F2ECE1]"
        }`}
      >
        {label}
      </div>
      <div
        tabIndex={0}
        className="dropdown-content bg-[#161410] rounded-xl z-20 w-64 p-3.5 shadow-2xl border border-[#C8A252]/25 space-y-3 mt-2"
      >
        <span className="text-[10px] font-mono-code uppercase tracking-wider text-[#9E9587] block">
          Background Music
        </span>
        <ul className="menu p-0 gap-1">
          <li>
            <button
              onClick={() => choose(null)}
              className={`rounded-lg text-xs px-2.5 py-1.5 ${
                !current ? "bg-[#C8A252]/20 text-[#C8A252]" : "text-[#F2ECE1]/80 hover:bg-white/5"
              }`}
            >
              Off
            </button>
          </li>
          {TRACKS.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => choose(t.id)}
                className={`rounded-lg text-xs px-2.5 py-1.5 flex justify-between ${
                  t.id === music.trackId
                    ? "bg-[#C8A252]/20 text-[#C8A252]"
                    : "text-[#F2ECE1]/80 hover:bg-white/5"
                }`}
              >
                <span>{t.name}</span>
                {t.id === music.trackId && music.playing && (
                  <span className="animate-pulse text-[10px]">Playing</span>
                )}
              </button>
            </li>
          ))}
        </ul>

        <label className="flex items-center gap-2.5 text-[10px] font-mono-code uppercase tracking-wider text-[#9E9587]">
          Vol
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={music.volume}
            onChange={(e) => musicPlayer.setVolume(Number(e.target.value))}
            className="range range-xs range-warning flex-1"
            aria-label="Music volume"
          />
        </label>

        {music.suppressed && current && (
          <p className="text-[11px] text-amber-300/90 leading-snug">
            Paused while voice chat is active. Resumes when voice channel empties.
          </p>
        )}

        {current && (
          <p className="text-[10px] text-[#9E9587] leading-snug border-t border-white/10 pt-2">
            “{current.title}” by {current.artist},{" "}
            <a href={MUSIC_LICENSE.url} target="_blank" rel="noreferrer" className="underline hover:text-[#C8A252]">
              {MUSIC_LICENSE.name}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
