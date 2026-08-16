import { describe, it, expect } from 'vitest';
import { evaluateGameState, isMonsterBreachingCore, createGameStateSystem } from '../src/ecs/systems/GameStateSystem';
import { GameStateValues, Position, Health, FactionTag, FactionValues, GameStateComponent, CampCoreComponent, SpireComponent } from '../src/ecs/components';
import { createWorld, addEntity, addComponent } from 'bitecs';

describe('GameStateSystem — Pure Logic', () => {
  it('should return DEFEAT if core is breached', () => {
    expect(evaluateGameState(true, true, true)).toBe(GameStateValues.DEFEAT);
    expect(evaluateGameState(true, false, false)).toBe(GameStateValues.DEFEAT);
  });

  it('should return VICTORY if core is not breached and both spires are dead', () => {
    expect(evaluateGameState(false, false, false)).toBe(GameStateValues.VICTORY);
  });

  it('should return RUNNING if core is not breached and at least one spire is alive', () => {
    expect(evaluateGameState(false, true, true)).toBe(GameStateValues.RUNNING);
    expect(evaluateGameState(false, true, false)).toBe(GameStateValues.RUNNING);
    expect(evaluateGameState(false, false, true)).toBe(GameStateValues.RUNNING);
  });

  it('isMonsterBreachingCore returns true when monster is at X: 1620, Y: 650 (within 40px radius of 1600)', () => {
    expect(isMonsterBreachingCore(1620, 650, 1600, 650)).toBe(true);
  });

  it('isMonsterBreachingCore returns false when monster is at X: 1800, Y: 650 (outside radius)', () => {
    expect(isMonsterBreachingCore(1800, 650, 1600, 650)).toBe(false);
  });
});

describe('GameStateSystem — ECS Integration', () => {
  it('Spawning a monster entity at (1610, 650) and running GameStateSystem sets GameStateComponent.state to DEFEAT', () => {
    const world = createWorld();

    // Core
    const core = addEntity(world);
    addComponent(world, CampCoreComponent, core);
    addComponent(world, Position, core);
    Position.x[core] = 1600;
    Position.y[core] = 650;

    // GameState
    const state = addEntity(world);
    addComponent(world, GameStateComponent, state);
    GameStateComponent.state[state] = GameStateValues.RUNNING;

    // Spire
    const spire = addEntity(world);
    addComponent(world, SpireComponent, spire);
    addComponent(world, Health, spire);
    SpireComponent.side[spire] = 0;
    Health.current[spire] = 100;

    // Monster breaching
    const monster = addEntity(world);
    addComponent(world, Position, monster);
    addComponent(world, Health, monster);
    addComponent(world, FactionTag, monster);
    Position.x[monster] = 1610;
    Position.y[monster] = 650;
    Health.current[monster] = 100;
    FactionTag.faction[monster] = FactionValues.Monster;

    const system = createGameStateSystem();
    system(world, 16);

    expect(GameStateComponent.state[state]).toBe(GameStateValues.DEFEAT);
  });
});
