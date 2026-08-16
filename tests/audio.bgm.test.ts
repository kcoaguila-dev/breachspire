import { describe, it, expect } from 'vitest';
import { getNoteFrequency, computeCrossfadeGains } from '../src/audio/AudioManager';

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
});
