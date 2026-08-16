import { describe, it, expect } from 'vitest';
import { evaluateGameState } from '../src/ecs/systems/GameStateSystem';
import { GameStateValues } from '../src/ecs/components';

describe('GameStateSystem — Pure Logic', () => {
  it('should return DEFEAT if core HP is 0 or less', () => {
    expect(evaluateGameState(0, true, true)).toBe(GameStateValues.DEFEAT);
    expect(evaluateGameState(-10, true, false)).toBe(GameStateValues.DEFEAT);
  });

  it('should return VICTORY if core is alive and both spires are dead', () => {
    expect(evaluateGameState(100, false, false)).toBe(GameStateValues.VICTORY);
  });

  it('should return RUNNING if core is alive and at least one spire is alive', () => {
    expect(evaluateGameState(100, true, true)).toBe(GameStateValues.RUNNING);
    expect(evaluateGameState(100, true, false)).toBe(GameStateValues.RUNNING);
    expect(evaluateGameState(100, false, true)).toBe(GameStateValues.RUNNING);
  });
});