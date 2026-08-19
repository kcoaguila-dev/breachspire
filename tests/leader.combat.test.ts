import { describe, it, expect } from 'vitest';
import { shouldLeaderDieFromAttack } from '../src/ecs/systems/GameStateSystem';
import { createWorld, addEntity, addComponent } from "bitecs";
import { Health, Attack, CombatTypeComponent, CombatTypeValues, FSMState, FSMStateValues, Position, PlayerControlled, GameStateComponent, GameStateValues, Velocity, Speed, FactionTag, FactionValues } from "../src/ecs/components";
import { createCombatSystem } from "../src/ecs/systems/CombatSystem";
import { createFSMSystem } from "../src/ecs/systems/FSMSystem";

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

  it('should cause CombatSystem to kill Player in proximity even if monster was targeting another entity', () => {
    const world = createWorld();

    // Game state
    const gs = addEntity(world);
    addComponent(world, GameStateComponent, gs);
    GameStateComponent.state[gs] = GameStateValues.RUNNING;

    // Distant Wall at x=5000
    const wallEid = addEntity(world);
    addComponent(world, Position, wallEid);
    Position.x[wallEid] = 5000;
    Position.y[wallEid] = 650;
    addComponent(world, Health, wallEid);
    Health.max[wallEid] = 100;
    Health.current[wallEid] = 100;
    addComponent(world, FactionTag, wallEid);
    FactionTag.faction[wallEid] = FactionValues.Hero;

    // Monster at x=1000, targeting distant wall
    const monsterEid = addEntity(world);
    addComponent(world, Position, monsterEid);
    Position.x[monsterEid] = 1000;
    Position.y[monsterEid] = 650;
    addComponent(world, Velocity, monsterEid);
    addComponent(world, Speed, monsterEid);
    Speed.value[monsterEid] = 50;
    addComponent(world, Health, monsterEid);
    Health.max[monsterEid] = 30;
    Health.current[monsterEid] = 30;
    addComponent(world, Attack, monsterEid);
    Attack.power[monsterEid] = 10;
    addComponent(world, CombatTypeComponent, monsterEid);
    CombatTypeComponent.type[monsterEid] = CombatTypeValues.Melee;
    addComponent(world, FactionTag, monsterEid);
    FactionTag.faction[monsterEid] = FactionValues.Monster;
    addComponent(world, FSMState, monsterEid);
    FSMState.state[monsterEid] = FSMStateValues.ENGAGE_TARGET;
    FSMState.targetEntity[monsterEid] = wallEid;

    // Player running past at x=1020 (within 20px of monster!)
    const playerEid = addEntity(world);
    addComponent(world, Position, playerEid);
    Position.x[playerEid] = 1020;
    Position.y[playerEid] = 650;
    addComponent(world, Health, playerEid);
    Health.max[playerEid] = 100;
    Health.current[playerEid] = 100;
    addComponent(world, CombatTypeComponent, playerEid);
    CombatTypeComponent.type[playerEid] = CombatTypeValues.Melee;
    addComponent(world, FactionTag, playerEid);
    FactionTag.faction[playerEid] = FactionValues.Hero;
    addComponent(world, PlayerControlled, playerEid);

    // Run FSM System (should retarget to player)
    const fsmSystem = createFSMSystem();
    fsmSystem(world, 16);
    expect(FSMState.targetEntity[monsterEid]).toBe(playerEid);

    // Run Combat System (should strike and defeat player in 1 hit)
    const combatSystem = createCombatSystem();
    combatSystem(world, 16);

    expect(Health.current[playerEid]).toBe(0);
    expect(GameStateComponent.state[gs]).toBe(GameStateValues.DEFEAT);
  });
});
