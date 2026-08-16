import { describe, it, expect } from 'vitest';
import { computeConstructionProgress } from '../src/ecs/systems/BuildingSystem';

describe('Building System', () => {
  it('should compute construction progress correctly', () => {
    // currentProgress: 0, builderSpeed: 100, delta: 1000ms (1 sec)
    // 0 + (100 * 1) = 100
    const progress = computeConstructionProgress(0, 100, 1000);
    expect(progress).toBe(100);
  });

  it('should compute construction progress correctly for half a second', () => {
    // currentProgress: 50, builderSpeed: 100, delta: 500ms (0.5 sec)
    // 50 + (100 * 0.5) = 100
    const progress = computeConstructionProgress(50, 100, 500);
    expect(progress).toBe(100);
  });
});
