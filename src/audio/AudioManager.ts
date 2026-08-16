export class AudioManager {
  private ctx: AudioContext;

  constructor() {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  // Helper function to create an oscillator and an envelope
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
    gain.connect(this.ctx.destination);

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
    // Noise burst for collapse
    if (this.ctx.state === 'suspended') {
        this.ctx.resume();
    }
    const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // lowpass filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }

  public playAetherChime() {
    this.playTone(1200, 'sine', 0.3, 0.4);
    setTimeout(() => this.playTone(1600, 'sine', 0.4, 0.3), 100);
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
