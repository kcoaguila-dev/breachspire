import { describe, it, expect } from 'vitest';
import { computeSpawnRate, shouldSpawnWave } from '../src/ecs/systems/MonsterSpawnSystem';

describe('MonsterSpawnSystem — Pure Logic', () => {
  it('should compute spawn rate throttle correctly based on cleared floors', () => {
    // 0 cleared, 3 total -> multiplier 1
    expect(computeSpawnRate(3000, 0, 3)).toBeCloseTo(3000);
    // 1 cleared, 3 total -> multiplier 1 + (1/3)*2 = 1.666 -> 3000 * 1.666 = 5000
    expect(computeSpawnRate(3000, 1, 3)).toBeCloseTo(5000);
    // 3 cleared, 3 total -> multiplier 1 + (3/3)*2 = 3 -> 3000 * 3 = 9000
    expect(computeSpawnRate(3000, 3, 3)).toBeCloseTo(9000);
  });

  it('should handle zero total floors correctly', () => {
    expect(computeSpawnRate(3000, 0, 0)).toBeCloseTo(3000);
  });

  it('shouldSpawnWave should trigger when timer >= cooldown', () => {
    expect(shouldSpawnWave(3000, 3000)).toBe(true);
    expect(shouldSpawnWave(3001, 3000)).toBe(true);
    expect(shouldSpawnWave(2999, 3000)).toBe(false);
  });
});