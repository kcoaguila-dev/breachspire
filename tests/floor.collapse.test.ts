import { describe, it, expect } from 'vitest';
import { isFloorClearable, calculateThrottleMultiplier } from '../src/ecs/systems/FloorCollapseSystem';

describe('FloorCollapseSystem — Pure Logic', () => {
  it('should identify when floor is clearable', () => {
    expect(isFloorClearable(0)).toBe(true);
    expect(isFloorClearable(-10)).toBe(true);
    expect(isFloorClearable(1)).toBe(false);
  });

  it('should calculate throttle multiplier correctly', () => {
    // 0 cleared, 3 total -> 1
    expect(calculateThrottleMultiplier(0, 3)).toBeCloseTo(1.0);
    // 1 cleared, 3 total -> 1 + (1/3)*2 = 1.666
    expect(calculateThrottleMultiplier(1, 3)).toBeCloseTo(1.6666666666666665);
    // 3 cleared, 3 total -> 3
    expect(calculateThrottleMultiplier(3, 3)).toBeCloseTo(3.0);
  });

  it('should handle zero total floors gracefully', () => {
    expect(calculateThrottleMultiplier(0, 0)).toBe(1.0);
  });
});