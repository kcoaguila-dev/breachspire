import { describe, it, expect } from 'vitest';
import { canEngageTarget } from '../src/ecs/systems/NestTargetingSystem';

describe('Nest Targeting Logic', () => {
  it('allows engagement if target is NOT in alcove, regardless of flight', () => {
    // Ground vs Ground
    expect(canEngageTarget(false, false)).toBe(true);
    // Flying vs Ground
    expect(canEngageTarget(false, true)).toBe(true);
  });

  it('allows engagement if target IS in alcove and attacker CAN fly', () => {
    // Flying vs Alcove
    expect(canEngageTarget(true, true)).toBe(true);
  });

  it('PREVENTS engagement if target IS in alcove and attacker CANNOT fly', () => {
    // Ground vs Alcove
    expect(canEngageTarget(true, false)).toBe(false);
  });
});
