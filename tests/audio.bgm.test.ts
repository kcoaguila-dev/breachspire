import { describe, it, expect } from 'vitest';
import { getNoteFrequency, computeCrossfadeGains, AudioManager } from '../src/audio/AudioManager';

describe('Audio BGM Math', () => {
  it('should compute correct frequency for A4', () => {
    // Midi note 69 is A4 (440Hz)
    expect(getNoteFrequency(69)).toBeCloseTo(440, 2);
  });

  it('should compute correct frequency for C4', () => {
    // Midi note 60 is C4 (261.63Hz)
    expect(getNoteFrequency(60)).toBeCloseTo(261.63, 2);
  });

  it('should crossfade correctly during day', () => {
    const isNight = false;

    let result = computeCrossfadeGains(isNight, 0);
    expect(result.dayGain).toBeCloseTo(0, 2);
    expect(result.nightGain).toBeCloseTo(1, 2);

    result = computeCrossfadeGains(isNight, 0.5);
    expect(result.dayGain).toBeCloseTo(0.5, 2);
    expect(result.nightGain).toBeCloseTo(0.5, 2);

    result = computeCrossfadeGains(isNight, 1);
    expect(result.dayGain).toBeCloseTo(1, 2);
    expect(result.nightGain).toBeCloseTo(0, 2);
  });

  it('should crossfade correctly during night', () => {
    const isNight = true;

    let result = computeCrossfadeGains(isNight, 0);
    expect(result.dayGain).toBeCloseTo(1, 2);
    expect(result.nightGain).toBeCloseTo(0, 2);

    result = computeCrossfadeGains(isNight, 0.5);
    expect(result.dayGain).toBeCloseTo(0.5, 2);
    expect(result.nightGain).toBeCloseTo(0.5, 2);

    result = computeCrossfadeGains(isNight, 1);
    expect(result.dayGain).toBeCloseTo(0, 2);
    expect(result.nightGain).toBeCloseTo(1, 2);
  });

  it('should crossfade correctly for blood_moon mood', () => {
    const result = computeCrossfadeGains('blood_moon', 1);
    expect(result.bloodMoonGain).toBeCloseTo(1, 2);
    expect(result.dayGain).toBeCloseTo(0, 2);
    expect(result.nightGain).toBeCloseTo(0, 2);
  });

  it('should cleanly replace activeInstance and cancel scheduler on destroy', () => {
    // Mock Web Audio Context in node test environment
    const mockCtx = {
      state: 'running',
      currentTime: 0,
      createGain: () => ({
        gain: { value: 1, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, cancelScheduledValues: () => {} },
        connect: () => {},
      }),
      destination: {},
      close: () => {},
      resume: () => {},
    };

    (globalThis as any).window = {
      AudioContext: function () {
        return mockCtx;
      },
    };

    const audio1 = new AudioManager();
    expect(AudioManager.getActiveInstance()).toBe(audio1);

    // Creating a second instance should destroy the first
    const audio2 = new AudioManager();
    expect(AudioManager.getActiveInstance()).toBe(audio2);

    audio2.destroy();
    expect(AudioManager.getActiveInstance()).toBeNull();
  });
});
