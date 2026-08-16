import { describe, it, expect } from 'vitest';
import { getMoteInteraction, clampEnergy } from '../src/ecs/systems/AetherCollectionSystem';

describe('AetherCollectionSystem — Pure Logic', () => {
  it('should return pickup when distance <= pickupRadius', () => {
    // Distance = 20 <= 25
    expect(getMoteInteraction(0, 0, 20, 0, 25, 120)).toBe('pickup');
    // Distance = 25 <= 25
    expect(getMoteInteraction(0, 0, 25, 0, 25, 120)).toBe('pickup');
  });

  it('should return magnet when pickupRadius < distance <= magnetRadius', () => {
    // Distance = 50 (25 < 50 <= 120)
    expect(getMoteInteraction(0, 0, 50, 0, 25, 120)).toBe('magnet');
    // Distance = 120 (25 < 120 <= 120)
    expect(getMoteInteraction(0, 0, 120, 0, 25, 120)).toBe('magnet');
  });

  it('should return none when distance > magnetRadius', () => {
    // Distance = 150 > 120
    expect(getMoteInteraction(0, 0, 150, 0, 25, 120)).toBe('none');
  });

  it('should clamp energy correctly', () => {
    expect(clampEnergy(50, 10, 100)).toBe(60);
    expect(clampEnergy(95, 10, 100)).toBe(100);
    expect(clampEnergy(100, 10, 100)).toBe(100);
  });
});
