import { describe, it, expect } from 'vitest';
import { getCombatMultiplier } from '../src/ecs/systems/CombatSystem';
import { CombatTypeValues } from '../src/ecs/components';

describe('RPS Combat Resolution', () => {
  it('should give advantage to Melee over Ranged', () => {
    const mult = getCombatMultiplier(CombatTypeValues.Melee, CombatTypeValues.Ranged);
    expect(mult).toBe(1.5);
  });

  it('should give disadvantage to Ranged vs Melee', () => {
    const mult = getCombatMultiplier(CombatTypeValues.Ranged, CombatTypeValues.Melee);
    expect(mult).toBe(0.5);
  });

  it('should give advantage to Ranged over Magic', () => {
    const mult = getCombatMultiplier(CombatTypeValues.Ranged, CombatTypeValues.Magic);
    expect(mult).toBe(1.5);
  });

  it('should give disadvantage to Magic vs Ranged', () => {
    const mult = getCombatMultiplier(CombatTypeValues.Magic, CombatTypeValues.Ranged);
    expect(mult).toBe(0.5);
  });

  it('should give advantage to Magic over Melee', () => {
    const mult = getCombatMultiplier(CombatTypeValues.Magic, CombatTypeValues.Melee);
    expect(mult).toBe(1.5);
  });

  it('should give disadvantage to Melee vs Magic', () => {
    const mult = getCombatMultiplier(CombatTypeValues.Melee, CombatTypeValues.Magic);
    expect(mult).toBe(0.5);
  });

  it('should return neutral multiplier for same combat types', () => {
    expect(getCombatMultiplier(CombatTypeValues.Melee, CombatTypeValues.Melee)).toBe(1.0);
    expect(getCombatMultiplier(CombatTypeValues.Ranged, CombatTypeValues.Ranged)).toBe(1.0);
    expect(getCombatMultiplier(CombatTypeValues.Magic, CombatTypeValues.Magic)).toBe(1.0);
  });
});