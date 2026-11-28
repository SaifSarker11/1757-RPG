import { safeVolume, validClickSound, type ClickSoundId } from "./preferences";
import { readPreference, writePreference } from "./browser-preferences";

/** Soft, original suspense cues synthesized locally; no audio downloads or tracking. */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private volume = 0.35;
  private enabled = true;
  private sound: ClickSoundId = "whisper";
  private initialized = false;
  private lastClick = -Infinity;
  private initPreferences() {
    if (this.initialized || typeof window === "undefined") return;
    this.initialized = true;
    this.enabled = readPreference("game-sfx-enabled") !== "false";
    this.volume = safeVolume(readPreference("game-sfx-volume"), 0.35);
    this.sound = validClickSound(readPreference("game-sfx-sound"));
  }
  private context(): AudioContext | null {
    this.initPreferences();
    if (typeof window === "undefined" || !this.enabled) return null;
    const AudioCtx = window.AudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) this.ctx = new AudioCtx();
    if (this.ctx.state === "suspended") void this.ctx.resume().catch(() => {});
    return this.ctx;
  }
  public isEnabled() { this.initPreferences(); return this.enabled; }
  public getVolume() { this.initPreferences(); return this.volume; }
  public getSound() { this.initPreferences(); return this.sound; }
  public setEnabled(value: boolean) {
    this.initPreferences(); this.enabled = value;
    writePreference("game-sfx-enabled", String(value));
  }
  public setVolume(value: number) {
    this.initPreferences(); this.volume = safeVolume(String(value), 0.35);
    writePreference("game-sfx-volume", String(this.volume));
  }
  public setSound(value: ClickSoundId) {
    this.initPreferences(); this.sound = validClickSound(value);
    writePreference("game-sfx-sound", this.sound);
  }
  private tone(frequency: number, duration: number, amplitude: number, delay = 0, endFrequency = frequency, type: OscillatorType = "sine") {
    const ctx = this.context(); if (!ctx || this.volume === 0) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    osc.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, amplitude * this.volume), now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    osc.start(now); osc.stop(now + duration + 0.01);
  }
  /** Each cue: a mysterious motif, a resonant body and fading echoes, like a cipher unlocking. */
  private echo(f: number, d: number, a: number, at: number, type: OscillatorType = "sine") {
    [0, 0.17, 0.34].forEach((t, i) => this.tone(f, d, a * [1, 0.35, 0.12][i], at + t, f * 0.995, type));
  }
  private cue(sound: ClickSoundId) {
    if (sound === "whisper") { // Secret cipher: falling minor second over a low drone
      this.tone(82.41, 0.55, 0.12, 0, 78, "triangle");
      this.echo(659.25, 0.16, 0.09, 0); this.echo(622.25, 0.22, 0.08, 0.07);
    }
    if (sound === "seal") { // Puzzle lock: two tumbler clicks, then a hollow resonance
      this.tone(2200, 0.03, 0.08, 0, 900, "square"); this.tone(2900, 0.03, 0.06, 0.055, 1200, "square");
      this.echo(311.13, 0.32, 0.12, 0.08, "triangle"); this.tone(466.16, 0.4, 0.04, 0.1);
    }
    if (sound === "drum") { // War omen: deep boom with an uneasy tritone
      this.tone(72, 0.45, 0.32, 0, 34); this.tone(146.83, 0.5, 0.06, 0.03, 140, "triangle");
      this.echo(207.65, 0.4, 0.05, 0.05);
    }
    if (sound === "chime") { // Phantom bell: tritone shimmer that dissolves
      this.echo(523.25, 0.5, 0.08, 0); this.tone(739.99, 0.6, 0.05, 0.02); this.echo(1046.5, 0.35, 0.03, 0.06);
    }
  }
  public preview(sound: ClickSoundId) { this.cue(sound); }
  public playClick() {
    const now = Date.now();
    // A single global click and a legacy handler may refer to the same action.
    if (now - this.lastClick < 60) return;
    this.lastClick = now; this.initPreferences(); this.cue(this.sound);
  }
  public playTimerTick() { this.tone(220, 0.08, 0.06); }
  public playPhaseChange() { this.tone(146.83, 0.5, 0.12); this.tone(155.56, 0.65, 0.055, 0.12); }
  public playSuccess() { [196, 293.66, 392].forEach((note, i) => this.tone(note, 0.4, 0.11, i * 0.09)); }
  public playFailure() { [196, 185, 146.83].forEach((note, i) => this.tone(note, 0.45, 0.1, i * 0.1)); }
  public playVictory() { [146.83, 220, 293.66, 440].forEach((note, i) => this.tone(note, 0.65, 0.1, i * 0.15)); }
}
export const gameAudio = new AudioEngine();
