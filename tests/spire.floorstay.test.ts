import { describe, it, expect } from 'vitest';
import { updateFloorStayTimer, shouldAscendFloor, getUnitAttackRate } from '../src/ecs/systems/SpireTowerCombatSystem';

describe('SpireTowerCombatSystem - Pure Logic', () => {
  describe('updateFloorStayTimer', () => {
    it('should decrement timer by delta in seconds', () => {
      const result = updateFloorStayTimer(10, 1000); // 10s current, 1000ms delta
      expect(result.remaining).toBe(9);
      expect(result.isExpired).toBe(false);
    });

    it('should clamp timer at 0 and return isExpired = true', () => {
      const result = updateFloorStayTimer(0.5, 1000);
      expect(result.remaining).toBe(0);
      expect(result.isExpired).toBe(true);
    });
  });

  describe('shouldAscendFloor', () => {
    it('should return true if room is cleared', () => {
      expect(shouldAscendFloor(true, false, false)).toBe(true);
    });

    it('should return true if timer is expired', () => {
      expect(shouldAscendFloor(false, true, false)).toBe(true);
    });

    it('should return false if neither room cleared nor timer expired', () => {
      expect(shouldAscendFloor(false, false, false)).toBe(false);
    });

    it('should return false if already at summit, regardless of clear/timer', () => {
      expect(shouldAscendFloor(true, true, true)).toBe(false);
    });
  });

  describe('getUnitAttackRate', () => {
    it('should return faster attack rate for light units', () => {
      expect(getUnitAttackRate(0, false)).toBe(600);
    });

    it('should return slower attack rate for heavy units', () => {
      expect(getUnitAttackRate(0, true)).toBe(1500);
    });
  });
});
