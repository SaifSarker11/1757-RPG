"use client";

import { useSyncExternalStore } from "react";

export interface Track {
  id: string;
  /** Name shown in the game. */
  name: string;
  /** Original title and artist, for the CC BY credit (see public/music/CREDITS.md). */
  title: string;
  artist: string;
  src: string;
}

export const TRACKS: readonly Track[] = [
  {
    id: "court",
    name: "Court of Murshidabad",
    title: "Relax Ay Sitar",
    artist: "Antti Luode",
    src: "/music/court-of-murshidabad.mp3",
  },
  {
    id: "council",
    name: "Council in Session",
    title: "Sitar and simple beats",
    artist: "Antti Luode",
    src: "/music/council-in-session.mp3",
  },
  {
    id: "plassey",
    name: "Eve of Plassey",
    title: "The fury of Sitar",
    artist: "Antti Luode",
    src: "/music/eve-of-plassey.mp3",
  },
];

export const MUSIC_LICENSE = { name: "CC BY 3.0", url: "https://creativecommons.org/licenses/by/3.0/" };

export interface MusicState {
  /** Chosen track, or null when the player turned music off. */
  trackId: string | null;
  volume: number;
  /** Actually audible right now. */
  playing: boolean;
  /** Paused for a while (e.g. voice chat), not by the player's choice. */
  suppressed: boolean;
  /** The browser is waiting for a click before it allows audio. */
  awaitingGesture: boolean;
}

const TRACK_KEY = "game-music-track";
const VOLUME_KEY = "game-music-volume";
const DEFAULT_VOLUME = 0.35;
const FADE_MS = 600;

const SERVER_STATE: MusicState = {
  trackId: null,
  volume: DEFAULT_VOLUME,
  playing: false,
  suppressed: false,
  awaitingGesture: false,
};

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode etc.: the choice just won't be remembered.
  }
}

/**
 * Looping background music, one track at a time. Lives at module level so it
 * keeps playing across client-side page changes (home → room). The player's
 * choice is saved; temporary pauses (voice chat) are tracked separately and
 * never overwrite it.
 */
class MusicPlayer {
  private audio: HTMLAudioElement | null = null;
  private state: MusicState = SERVER_STATE;
  private readonly suppressors = new Set<string>();
  private readonly listeners = new Set<() => void>();
  private fade: ReturnType<typeof setInterval> | null = null;
  private initialized = false;

  private init(): void {
    if (this.initialized || typeof window === "undefined") return;
    this.initialized = true;
    const saved = read(TRACK_KEY);
    const trackId = saved === "off" ? null : (TRACKS.find((t) => t.id === saved)?.id ?? TRACKS[0]!.id);
    const volume = Number.parseFloat(read(VOLUME_KEY) ?? "");
    this.state = {
      ...this.state,
      trackId,
      volume: Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : DEFAULT_VOLUME,
    };

    // Browsers block audio until the user interacts with the page.
    const unlock = () => {
      if (this.state.awaitingGesture) this.sync();
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    this.sync();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.init();
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): MusicState => this.state;
  getServerSnapshot = (): MusicState => SERVER_STATE;

  /** null turns music off. */
  setTrack(trackId: string | null): void {
    this.init();
    write(TRACK_KEY, trackId ?? "off");
    this.update({ trackId });
    this.sync();
  }

  /** Cycles Off → track 1 → … → last track → Off. */
  next(): void {
    const index = TRACKS.findIndex((t) => t.id === this.state.trackId);
    this.setTrack(index === TRACKS.length - 1 ? null : TRACKS[index + 1]!.id);
  }

  setVolume(volume: number): void {
    const clamped = Math.min(1, Math.max(0, volume));
    write(VOLUME_KEY, String(clamped));
    this.update({ volume: clamped });
    if (this.audio && !this.fade) this.audio.volume = clamped;
  }

  /** Temporarily silences the music while `reason` is active, without changing the choice. */
  setSuppressed(reason: string, active: boolean): void {
    this.init();
    if (active) this.suppressors.add(reason);
    else this.suppressors.delete(reason);
    this.update({ suppressed: this.suppressors.size > 0 });
    this.sync();
  }

  private update(patch: Partial<MusicState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }

  /** Makes the audio element match the state. */
  private sync(): void {
    const track = TRACKS.find((t) => t.id === this.state.trackId);
    const shouldPlay = track !== undefined && this.suppressors.size === 0;

    if (!shouldPlay) {
      this.fadeTo(0, () => this.audio?.pause());
      this.update({ playing: false, awaitingGesture: false });
      return;
    }

    if (!this.audio) {
      this.audio = new Audio();
      this.audio.loop = true;
      this.audio.preload = "auto";
    }
    const audio = this.audio;
    if (!audio.src.endsWith(track.src)) {
      audio.src = track.src;
      audio.currentTime = 0;
    }
    if (!audio.paused && this.state.playing) return;

    audio.volume = 0;
    audio
      .play()
      .then(() => {
        this.update({ playing: true, awaitingGesture: false });
        this.fadeTo(this.state.volume);
      })
      .catch((error: unknown) => {
        // NotAllowedError: autoplay blocked until a click/keypress.
        const blocked = error instanceof DOMException && error.name === "NotAllowedError";
        this.update({ playing: false, awaitingGesture: blocked });
      });
  }

  private fadeTo(target: number, done?: () => void): void {
    const audio = this.audio;
    if (this.fade) clearInterval(this.fade);
    this.fade = null;
    if (!audio) return done?.();

    const start = audio.volume;
    const steps = Math.max(1, Math.round(FADE_MS / 30));
    let step = 0;
    this.fade = setInterval(() => {
      step += 1;
      audio.volume = Math.min(1, Math.max(0, start + ((target - start) * step) / steps));
      if (step >= steps) {
        if (this.fade) clearInterval(this.fade);
        this.fade = null;
        done?.();
      }
    }, 30);
  }
}

export const musicPlayer = new MusicPlayer();

export function useMusic(): MusicState {
  return useSyncExternalStore(musicPlayer.subscribe, musicPlayer.getSnapshot, musicPlayer.getServerSnapshot);
}
