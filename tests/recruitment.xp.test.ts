import { describe, it, expect } from 'vitest';
import { canAffordRecruitment } from '../src/ecs/systems/RecruitmentSystem';
import { computeXpGain } from '../src/ecs/systems/ProgressionXPSystem';

describe('Recruitment System', () => {
  it('should return true if energy is greater than or equal to cost', () => {
    expect(canAffordRecruitment(10, 5)).toBe(true);
    expect(canAffordRecruitment(5, 5)).toBe(true);
  });

  it('should return false if energy is less than cost', () => {
    expect(canAffordRecruitment(4, 5)).toBe(false);
  });
});

describe('Progression XP System', () => {
  it('should compute xp gain and single level up correctly', () => {
    const result = computeXpGain(40, 20, 50);
    expect(result.didLevelUp).toBe(true);
    expect(result.newLevel).toBe(1);
    expect(result.remainingXp).toBe(10);
  });

  it('should compute xp gain without level up correctly', () => {
    const result = computeXpGain(10, 20, 50);
    expect(result.didLevelUp).toBe(false);
    expect(result.newLevel).toBe(0);
    expect(result.remainingXp).toBe(30);
  });

  it('should handle multiple level ups in one gain', () => {
    // Current XP = 0, gained = 150.
    // Level 1 -> 2: 50 XP
    // Level 2 -> 3: 75 XP (50 * 1.5)
    // Level 3 -> 4: 112 XP (75 * 1.5)
    // Total used for 2 levels: 50 + 75 = 125.
    // Remaining XP: 150 - 125 = 25.
    const result = computeXpGain(0, 150, 50);
    expect(result.didLevelUp).toBe(true);
    expect(result.newLevel).toBe(2);
    expect(result.remainingXp).toBe(25);
  });
});
