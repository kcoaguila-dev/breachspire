import { describe, it, expect } from 'vitest';
import { decideSpireAction, computeSpireEnergyRate } from '../src/ecs/systems/SpireDirectorSystem';

describe('SpireDirectorSystem pure functions', () => {
  describe('decideSpireAction', () => {
    it('should wait during the day if energy is low', () => {
      expect(decideSpireAction(30, false)).toBe('WAIT');
    });

    it('should fortify crystal during the day if energy >= 40', () => {
      expect(decideSpireAction(45, false)).toBe('FORTIFY_CRYSTAL');
    });

    it('should prioritize spawning TROLL at night if energy >= 60', () => {
      expect(decideSpireAction(65, true)).toBe('SPAWN_TROLL');
    });

    it('should prioritize spawning ARCHER at night if energy >= 25 but < 60', () => {
      expect(decideSpireAction(30, true)).toBe('SPAWN_ARCHER');
    });

    it('should prioritize spawning GOBLIN at night if energy >= 10 but < 25', () => {
      expect(decideSpireAction(15, true)).toBe('SPAWN_GOBLIN');
    });

    it('should wait at night if energy < 10', () => {
      expect(decideSpireAction(5, true)).toBe('WAIT');
    });
  });

  describe('computeSpireEnergyRate', () => {
    it('should return 0 if total floors is 0', () => {
      expect(computeSpireEnergyRate(10, 0, 0)).toBe(0);
    });

    it('should return full base rate if all floors are active', () => {
      expect(computeSpireEnergyRate(10, 5, 5)).toBe(10);
    });

    it('should permanently reduce rate if active floors are less than total floors', () => {
      expect(computeSpireEnergyRate(10, 3, 5)).toBe(6);
    });
  });
});
