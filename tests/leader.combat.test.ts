import { describe, it, expect } from 'vitest';
import { shouldLeaderDieFromAttack } from '../src/ecs/systems/GameStateSystem';

describe('shouldLeaderDieFromAttack (1-Hit Permadeath)', () => {
  it('should return true if target is a player and took damage', () => {
    expect(shouldLeaderDieFromAttack(true, 5)).toBe(true);
  });

  it('should return false if target is a player but damage is 0', () => {
    expect(shouldLeaderDieFromAttack(true, 0)).toBe(false);
  });

  it('should return false if target is not a player (even if damage is > 0)', () => {
    expect(shouldLeaderDieFromAttack(false, 10)).toBe(false);
  });

  it('should return false if target is not a player and damage is 0', () => {
    expect(shouldLeaderDieFromAttack(false, 0)).toBe(false);
  });
});
