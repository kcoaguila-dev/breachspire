import { describe, it, expect } from 'vitest';
import { shouldSpawnAetherMote } from '../src/ecs/systems/AetherSpawningSystem';

describe('AetherSpawningSystem — Pure Logic', () => {
  it('should spawn a mote when timer is >= interval and motes < max', () => {
    expect(shouldSpawnAetherMote(4000, 4000, 0, 10)).toBe(true);
    expect(shouldSpawnAetherMote(5000, 4000, 9, 10)).toBe(true);
  });

  it('should not spawn a mote when timer is < interval', () => {
    expect(shouldSpawnAetherMote(3999, 4000, 0, 10)).toBe(false);
  });

  it('should not spawn a mote when motes >= max', () => {
    expect(shouldSpawnAetherMote(4000, 4000, 10, 10)).toBe(false);
    expect(shouldSpawnAetherMote(5000, 4000, 11, 10)).toBe(false);
  });
});
