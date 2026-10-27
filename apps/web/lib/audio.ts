// Procedural 8-bit chiptune sound effects engine using Web Audio API
class AudioEngine {
  private ctx: AudioContext | null = null;
  private volume: number = 0.5; // default volume
  private enabled: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("game-sfx-enabled");
      this.enabled = saved === "true";
      const savedVol = localStorage.getItem("game-sfx-volume");
      if (savedVol) this.volume = parseFloat(savedVol);
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (typeof window !== "undefined") {
      localStorage.setItem("game-sfx-enabled", String(val));
    }
    if (val) {
      this.initCtx();
      this.playClick();
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (typeof window !== "undefined") {
      localStorage.setItem("game-sfx-volume", String(this.volume));
    }
  }

  private createOscillator(
    type: OscillatorType,
    freq: number,
    duration: number,
    gainStart: number
  ): { osc: OscillatorNode; gain: GainNode } | null {
    this.initCtx();
    if (!this.ctx || !this.enabled) return null;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(gainStart * this.volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    return { osc, gain };
  }

  public playClick() {
    const sound = this.createOscillator("triangle", 150, 0.08, 0.4);
    if (!sound) return;
    sound.osc.frequency.exponentialRampToValueAtTime(600, this.ctx!.currentTime + 0.08);
    sound.osc.start();
    sound.osc.stop(this.ctx!.currentTime + 0.08);
  }

  public playTimerTick() {
    const sound = this.createOscillator("sine", 800, 0.05, 0.2);
    if (!sound) return;
    sound.osc.start();
    sound.osc.stop(this.ctx!.currentTime + 0.05);
  }

  public playPhaseChange() {
    this.initCtx();
    if (!this.ctx || !this.enabled) return;

    const now = this.ctx.currentTime;
    const notes = [220, 330, 440, 660];
    notes.forEach((freq, index) => {
      const time = now + index * 0.08;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.15 * this.volume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(time);
      osc.stop(time + 0.15);
    });
  }

  public playSuccess() {
    this.initCtx();
    if (!this.ctx || !this.enabled) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      const time = now + index * 0.1;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.25 * this.volume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(time);
      osc.stop(time + 0.25);
    });
  }

  public playFailure() {
    this.initCtx();
    if (!this.ctx || !this.enabled) return;

    const now = this.ctx.currentTime;
    const notes = [293.66, 277.18, 261.63, 220.0]; // D4, C#4, C4, A3
    notes.forEach((freq, index) => {
      const time = now + index * 0.12;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.2 * this.volume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(time);
      osc.stop(time + 0.3);
    });
  }

  public playVictory() {
    this.initCtx();
    if (!this.ctx || !this.enabled) return;

    const now = this.ctx.currentTime;
    // Ascending major arpeggio followed by sustained chord
    const sequence = [
      { note: 261.63, start: 0, dur: 0.15 }, // C4
      { note: 329.63, start: 0.15, dur: 0.15 }, // E4
      { note: 392.00, start: 0.3, dur: 0.15 }, // G4
      { note: 523.25, start: 0.45, dur: 0.6 }, // C5
    ];

    sequence.forEach((item) => {
      const time = now + item.start;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(item.note, time);
      gain.gain.setValueAtTime(0.3 * this.volume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + item.dur);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(time);
      osc.stop(time + item.dur);
    });
  }
}

export const gameAudio = new AudioEngine();
