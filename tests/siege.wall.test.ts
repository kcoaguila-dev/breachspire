import { describe, it, expect } from 'vitest';
import { applyWallDamage, isWallBreached } from '../src/ecs/systems/CampSiegeSystem';

describe('CampSiegeSystem — Pure Logic', () => {
  it('should apply damage and clamp at 0', () => {
    expect(applyWallDamage(100, 20)).toBe(80);
    expect(applyWallDamage(100, 150)).toBe(0);
    expect(applyWallDamage(0, 50)).toBe(0);
  });

  it('should identify breached wall correctly', () => {
    expect(isWallBreached(0)).toBe(true);
    expect(isWallBreached(-10)).toBe(true);
    expect(isWallBreached(1)).toBe(false);
    expect(isWallBreached(100)).toBe(false);
  });
});