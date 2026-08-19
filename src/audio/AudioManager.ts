
export function getNoteFrequency(midiNote: number): number {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

export function computeCrossfadeGains(mood: 'day' | 'night' | 'blood_moon' | boolean, progress: number): { dayGain: number, nightGain: number, bloodMoonGain: number } {
  const p = Math.max(0, Math.min(1, progress));
  if (mood === 'blood_moon') {
    return { dayGain: 0, nightGain: (1 - p) * 0.2, bloodMoonGain: p };
  } else if (mood === 'night' || mood === true) {
    return { dayGain: 1 - p, nightGain: p, bloodMoonGain: 0 };
  } else {
    return { dayGain: p, nightGain: 1 - p, bloodMoonGain: 0 };
  }
}

export class AudioManager {
  private static activeInstance: AudioManager | null = null;

  public static getActiveInstance(): AudioManager | null {
    return AudioManager.activeInstance;
  }

  private ctx: AudioContext;
  private masterGain: GainNode;
  private dayGain: GainNode;
  private nightGain: GainNode;
  private bloodMoonGain: GainNode;
  private isMuted: boolean = false;
  private bgmStarted: boolean = false;
  // @ts-ignore
  private schedulerTimer: any;
  private nextNoteTime: number = 0;
  private beatCount: number = 0;

  constructor() {
    // If an existing AudioManager is running, stop and destroy it to prevent duplicate BGMs
    if (AudioManager.activeInstance) {
      AudioManager.activeInstance.destroy();
    }
    AudioManager.activeInstance = this;

    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 1;
    this.masterGain.connect(this.ctx.destination);

    this.dayGain = this.ctx.createGain();
    this.dayGain.gain.value = 0;
    this.dayGain.connect(this.masterGain);

    this.nightGain = this.ctx.createGain();
    this.nightGain.gain.value = 0;
    this.nightGain.connect(this.masterGain);

    this.bloodMoonGain = this.ctx.createGain();
    this.bloodMoonGain.gain.value = 0;
    this.bloodMoonGain.connect(this.masterGain);
  }

  // BGM Methods
  public startBGM() {
    if (this.bgmStarted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.bgmStarted = true;

    this.dayGain.gain.setValueAtTime(1, this.ctx.currentTime);
    this.nightGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.bloodMoonGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.scheduleBGM();
  }

  public stopBGM() {
    if (this.schedulerTimer) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    this.bgmStarted = false;
  }

  public destroy() {
    this.stopBGM();
    if (AudioManager.activeInstance === this) {
      AudioManager.activeInstance = null;
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        this.ctx.close();
      } catch (e) {
        // ignore
      }
    }
  }

  public setMusicMood(mood: 'day' | 'night' | 'blood_moon', crossfadeDurationMs: number) {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    const t = this.ctx.currentTime;
    const duration = crossfadeDurationMs / 1000;

    const target = computeCrossfadeGains(mood, 1.0);

    this.dayGain.gain.cancelScheduledValues(t);
    this.dayGain.gain.setValueAtTime(this.dayGain.gain.value, t);
    this.dayGain.gain.linearRampToValueAtTime(target.dayGain, t + duration);

    this.nightGain.gain.cancelScheduledValues(t);
    this.nightGain.gain.setValueAtTime(this.nightGain.gain.value, t);
    this.nightGain.gain.linearRampToValueAtTime(target.nightGain, t + duration);

    this.bloodMoonGain.gain.cancelScheduledValues(t);
    this.bloodMoonGain.gain.setValueAtTime(this.bloodMoonGain.gain.value, t);
    this.bloodMoonGain.gain.linearRampToValueAtTime(target.bloodMoonGain, t + duration);
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    const t = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
    if (this.isMuted) {
      this.masterGain.gain.linearRampToValueAtTime(0, t + 0.1);
    } else {
      this.masterGain.gain.linearRampToValueAtTime(1, t + 0.1);
    }
  }

  private scheduleBGM() {
    if (!this.bgmStarted || (this.ctx && this.ctx.state === 'closed')) return;

    while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
      this.playBGMBeat(this.nextNoteTime);
      this.nextNoteTime += 0.5; // 120 BPM base
      this.beatCount++;
    }
    this.schedulerTimer = setTimeout(() => this.scheduleBGM(), 50);
  }

  private playBGMBeat(time: number) {
    // Day Theme: Major pentatonic
    const dayNotes = [60, 62, 64, 67, 69, 72]; // C4, D4, E4, G4, A4, C5
    const dayNote = dayNotes[this.beatCount % dayNotes.length];
    this.playSynth(getNoteFrequency(dayNote), 'sine', time, 1.0, 0.2, this.dayGain, 800);

    if (this.beatCount % 4 === 0) {
      this.playSynth(getNoteFrequency(48), 'triangle', time, 2.0, 0.1, this.dayGain, 500); // C3
      this.playSynth(getNoteFrequency(55), 'triangle', time, 2.0, 0.1, this.dayGain, 500); // G3
    }

    // Night Theme: Minor arpeggios, pulsing bass, drum heartbeat
    const nightNotes = [60, 63, 67, 72, 67, 63]; // C minor
    const nightNote = nightNotes[this.beatCount % nightNotes.length];
    this.playSynth(getNoteFrequency(nightNote), 'sawtooth', time, 0.5, 0.05, this.nightGain, 1200);

    if (this.beatCount % 2 === 0) {
      this.playSynth(getNoteFrequency(36), 'square', time, 0.5, 0.15, this.nightGain, 400); // C2
    }

    if (this.beatCount % 4 === 0 || this.beatCount % 4 === 1) {
      this.playDrum(time, this.nightGain);
    }

    // Blood Moon Siege Theme: Fast Diminished arpeggios, rapid war drums, sub-bass rumble
    const bloodMoonNotes = [57, 60, 63, 66, 69, 66, 63, 60]; // A diminished siege scale
    const bloodNote = bloodMoonNotes[this.beatCount % bloodMoonNotes.length];
    this.playSynth(getNoteFrequency(bloodNote), 'sawtooth', time, 0.35, 0.12, this.bloodMoonGain, 1800);
    this.playSynth(getNoteFrequency(bloodNote + 12), 'square', time, 0.25, 0.06, this.bloodMoonGain, 2400);

    // Rapid War Drums on every beat + sub pulse
    this.playDrum(time, this.bloodMoonGain);
    if (this.beatCount % 2 === 0) {
      this.playSynth(getNoteFrequency(33), 'square', time, 0.6, 0.25, this.bloodMoonGain, 300); // A0 Sub-bass
    }
  }

  private playSynth(frequency: number, type: OscillatorType, time: number, duration: number, volume: number, destination: AudioNode, filterFreq: number) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, time);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, time);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    osc.start(time);
    osc.stop(time + duration);
  }

  private playDrum(time: number, destination: AudioNode) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);

    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(time);
    osc.stop(time + 0.5);
  }

  public playAetherCollect() {
    this.playAetherChime(); // Reusing the chime logic or similar
  }

  // SFX Helper
  private playTone(frequency: number, type: OscillatorType, duration: number, volume: number = 0.5) {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  public playSlash() {
    this.playTone(300, 'sawtooth', 0.1, 0.3);
  }

  public playArrow() {
    this.playTone(800, 'triangle', 0.05, 0.2);
  }

  public playWallHit() {
    this.playTone(150, 'square', 0.15, 0.5);
  }

  public playCollapse() {
    if (this.ctx.state === 'suspended') {
        this.ctx.resume();
    }
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
  }

  public playAetherChime() {
    this.playTone(1200, 'sine', 0.3, 0.4);
    setTimeout(() => this.playTone(1600, 'sine', 0.4, 0.3), 100);
  }

  public playChop() {
    this.playTone(180, 'square', 0.08, 0.4);
  }

  public playPickaxe() {
    this.playTone(2200, 'triangle', 0.05, 0.3);
    setTimeout(() => this.playTone(1800, 'sine', 0.1, 0.2), 30);
  }

  public playTreeFalling() {
    this.playCollapse();
  }

  public playHammer() {
    this.playTone(400, 'triangle', 0.06, 0.35);
  }

  public playVictoryStinger() {
    this.playTone(440, 'square', 0.2);
    setTimeout(() => this.playTone(554, 'square', 0.2), 200);
    setTimeout(() => this.playTone(659, 'square', 0.4), 400);
  }

  public playDefeatStinger() {
    this.playTone(300, 'sawtooth', 0.4);
    setTimeout(() => this.playTone(250, 'sawtooth', 0.4), 300);
    setTimeout(() => this.playTone(200, 'sawtooth', 0.8), 600);
  }
}
