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
  /** Detuned, dissonant layers that never resolve: suspense, unease and a puzzle left unsolved. */
  private echo(f: number, d: number, a: number, at: number, type: OscillatorType = "sine") {
    [0, 0.13, 0.29, 0.47].forEach((t, i) => this.tone(f * (1 + i * 0.006), d, a * ([1, 0.45, 0.2, 0.08][i] ?? 0), at + t, f * 0.97, type));
  }
  private noise(duration: number, amplitude: number, delay = 0, from = 3000, to = 400) {
    const ctx = this.context(); if (!ctx || this.volume === 0) return;
    const now = ctx.currentTime + delay;
    const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * duration)), ctx.sampleRate);
    const data = buffer.getChannelData(0); for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buffer;
    const filter = ctx.createBiquadFilter(); filter.type = "bandpass"; filter.Q.value = 6;
    filter.frequency.setValueAtTime(from, now); filter.frequency.exponentialRampToValueAtTime(to, now + duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, amplitude * this.volume), now + duration * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    src.onended = () => { src.disconnect(); filter.disconnect(); gain.disconnect(); };
    src.start(now); src.stop(now + duration + 0.01);
  }
  private cue(sound: ClickSoundId) {
    if (sound === "whisper") { // Secret cipher: reversed breath, beating tritone, falling question
      this.noise(0.28, 0.07, 0, 600, 4200);
      this.tone(55, 0.7, 0.16, 0.18, 49, "triangle"); this.tone(56.6, 0.7, 0.1, 0.18, 50, "triangle");
      this.echo(698.46, 0.2, 0.08, 0.2); this.echo(493.88, 0.3, 0.07, 0.3); this.tone(466.16, 0.5, 0.05, 0.42, 440);
    }
    if (sound === "seal") { // Puzzle lock: three uneven tumblers, then a cluster that refuses to settle
      [0, 0.07, 0.19].forEach((t, i) => this.tone([2600, 1800, 3300][i] ?? 2000, 0.025, 0.08, t, 700, "square"));
      this.noise(0.08, 0.05, 0.2, 5000, 1500);
      this.echo(277.18, 0.45, 0.1, 0.24, "triangle"); this.tone(293.66, 0.5, 0.06, 0.26); this.tone(415.3, 0.55, 0.04, 0.3, 392);
    }
    if (sound === "drum") { // War omen: heartbeat double-thud, distant cannon rumble, dread swell
      this.tone(64, 0.3, 0.34, 0, 32); this.tone(58, 0.35, 0.28, 0.16, 30);
      this.noise(0.6, 0.06, 0.05, 300, 60);
      this.tone(103.83, 0.7, 0.05, 0.1, 98, "sawtooth"); this.echo(146.83, 0.5, 0.04, 0.2);
    }
    if (sound === "chime") { // Phantom bell: inharmonic bell partials that drift out of tune
      [1, 2.76, 5.4, 8.93].forEach((ratio, i) => this.tone(311.13 * ratio, 0.9 - i * 0.15, 0.07 / (i + 1), i * 0.01, 311.13 * ratio * 0.985));
      this.echo(440, 0.4, 0.035, 0.12); this.noise(0.4, 0.025, 0.05, 8000, 2000);
    }
  }
  /** Short haptic pattern matched to each cue on devices that support vibration. */
  private haptic(sound: ClickSoundId) {
    if (!this.enabled || typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
    const patterns: Record<ClickSoundId, number[]> = { whisper: [8, 40, 14], seal: [6, 30, 6, 60, 18], drum: [28, 60, 22], chime: [12] };
    try { navigator.vibrate(patterns[sound]); } catch { /* unsupported */ }
  }
  public preview(sound: ClickSoundId) { this.initPreferences(); this.cue(sound); this.haptic(sound); }
  public playClick() {
    const now = Date.now();
    // A single global click and a legacy handler may refer to the same action.
    if (now - this.lastClick < 60) return;
    this.lastClick = now; this.initPreferences(); this.cue(this.sound); this.haptic(this.sound);
  }
  public playTimerTick() { this.tone(220, 0.08, 0.06); }
  public playPhaseChange() { this.tone(146.83, 0.5, 0.12); this.tone(155.56, 0.65, 0.055, 0.12); }
  public playSuccess() { [196, 293.66, 392].forEach((note, i) => this.tone(note, 0.4, 0.11, i * 0.09)); }
  public playFailure() { [196, 185, 146.83].forEach((note, i) => this.tone(note, 0.45, 0.1, i * 0.1)); }
  public playVictory() { [146.83, 220, 293.66, 440].forEach((note, i) => this.tone(note, 0.65, 0.1, i * 0.15)); }
}
export const gameAudio = new AudioEngine();
