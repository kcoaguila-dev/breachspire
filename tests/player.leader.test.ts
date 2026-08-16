import { describe, it, expect, beforeEach } from "vitest";
import { createWorld, addEntity, addComponent } from "bitecs";
import { createFSMSystem } from "../src/ecs/systems/FSMSystem";
import { createCombatSystem } from "../src/ecs/systems/CombatSystem";
import {
  PlayerControlled,
  Health,
  Position,
  FSMState,
  FSMStateValues,
  Velocity,
  Speed,
  FactionTag,
  FactionValues,
  CombatTypeComponent,
  CombatTypeValues,
  Attack
} from "../src/ecs/components";

describe("Player Autonomous Systems Bypass", () => {
  let world: any;
  let fsmSystem: any;
  let combatSystem: any;

  beforeEach(() => {
    world = createWorld();
    fsmSystem = createFSMSystem();
    combatSystem = createCombatSystem();
  });

  it("should bypass PlayerControlled entities in FSMSystem and CombatSystem", () => {
    // 1. Setup Enemy Entity
    const enemyEid = addEntity(world);
    addComponent(world, Health, enemyEid);
    Health.current[enemyEid] = 100;
    addComponent(world, Position, enemyEid);
    Position.x[enemyEid] = 100;
    Position.y[enemyEid] = 100;
    addComponent(world, FactionTag, enemyEid);
    FactionTag.faction[enemyEid] = FactionValues.Monster;

    // 2. Setup Player Entity (within engage distance of enemy)
    const playerEid = addEntity(world);
    addComponent(world, PlayerControlled, playerEid);
    addComponent(world, Health, playerEid);
    Health.current[playerEid] = 100;
    addComponent(world, Position, playerEid);
    Position.x[playerEid] = 110; // Very close to enemy
    Position.y[playerEid] = 100;
    addComponent(world, FactionTag, playerEid);
    FactionTag.faction[playerEid] = FactionValues.Hero;

    addComponent(world, FSMState, playerEid);
    FSMState.state[playerEid] = FSMStateValues.IDLE;
    FSMState.targetEntity[playerEid] = 0;

    addComponent(world, Velocity, playerEid);
    Velocity.x[playerEid] = 0;
    Velocity.y[playerEid] = 0;

    addComponent(world, Speed, playerEid);
    Speed.value[playerEid] = 100;

    addComponent(world, CombatTypeComponent, playerEid);
    CombatTypeComponent.type[playerEid] = CombatTypeValues.Melee;

    addComponent(world, Attack, playerEid);
    Attack.power[playerEid] = 50;

    // Run FSM System
    fsmSystem(world, 16);

    // Player should remain in IDLE state because FSM System ignores PlayerControlled
    expect(FSMState.state[playerEid]).toBe(FSMStateValues.IDLE);

    // Force Player into ENGAGE_TARGET state to test CombatSystem bypass
    FSMState.state[playerEid] = FSMStateValues.ENGAGE_TARGET;
    FSMState.targetEntity[playerEid] = enemyEid;

    // Run Combat System
    combatSystem(world, 16);

    // Enemy Health should remain 100 because Combat System ignores PlayerControlled
    expect(Health.current[enemyEid]).toBe(100);
  });
});
