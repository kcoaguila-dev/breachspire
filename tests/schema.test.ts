import { describe, it, expect } from 'vitest';
import { UnitStatsSchema } from '../src/data/schemas';

describe('UnitStatsSchema validation', () => {
  it('should accept valid unit data', () => {
    const validData = {
      id: 'test_unit',
      name: 'Test Unit',
      faction: 'hero',
      combatType: 'melee',
      health: 100,
      attack: 20,
      speed: 1.5,
    };

    const result = UnitStatsSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid faction', () => {
    const invalidData = {
      id: 'test_unit',
      name: 'Test Unit',
      faction: 'invalid_faction', // Invalid
      combatType: 'melee',
      health: 100,
      attack: 20,
      speed: 1.5,
    };

    const result = UnitStatsSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject missing fields', () => {
    const invalidData = {
      id: 'test_unit',
      name: 'Test Unit',
      // missing faction, health, etc.
    };

    const result = UnitStatsSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject negative health', () => {
    const invalidData = {
      id: 'test_unit',
      name: 'Test Unit',
      faction: 'monster',
      combatType: 'melee',
      health: -10, // Invalid
      attack: 20,
      speed: 1.5,
    };

    const result = UnitStatsSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});