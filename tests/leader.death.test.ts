import { describe, it, expect, beforeEach } from "vitest";
import { createWorld, addEntity, addComponent } from "bitecs";
import {
  calculateRetainedLoot,
  shouldTriggerSoftFail,
  createLeaderDeathSystem
} from "../src/ecs/systems/LeaderDeathSystem";
import {
  PlayerControlled,
  Health,
  FSMState,
  FSMStateValues,
  SoftFailRetreatComponent,
  Position,
  CampCoreComponent,
  RunSpoilsComponent
} from "../src/ecs/components";
import { hasComponent } from "bitecs";

describe("Leader Death System", () => {

  describe("Pure Logic: shouldTriggerSoftFail", () => {
    it("should return true if entity is player controlled and HP is 0", () => {
      expect(shouldTriggerSoftFail(true, 0)).toBe(true);
    });

    it("should return true if entity is player controlled and HP is negative", () => {
      expect(shouldTriggerSoftFail(true, -10)).toBe(true);
    });

    it("should return false if HP is > 0", () => {
      expect(shouldTriggerSoftFail(true, 10)).toBe(false);
    });

    it("should return false if entity is not player controlled", () => {
      expect(shouldTriggerSoftFail(false, 0)).toBe(false);
    });
  });

  describe("Pure Logic: calculateRetainedLoot", () => {
    it("should correctly multiply and retain partial loot", () => {
      expect(calculateRetainedLoot(100, 0.5)).toBe(50);
      expect(calculateRetainedLoot(100, 0.25)).toBe(25);
    });

    it("should not drop below zero", () => {
      expect(calculateRetainedLoot(-50, 0.5)).toBe(0);
    });
  });

  describe("System Factory: createLeaderDeathSystem", () => {
    let world: any;
    let system: any;

    beforeEach(() => {
      world = createWorld();
      system = createLeaderDeathSystem();
    });

    it("should restore partial HP, change state to FLEE, position to camp, and half run spoils on soft fail", () => {
      // 1. Setup CampCore
      const coreEid = addEntity(world);
      addComponent(world, CampCoreComponent, coreEid);
      addComponent(world, Position, coreEid);
      Position.x[coreEid] = 150;
      Position.y[coreEid] = 200;

      // 2. Setup Player Controlled Entity at 0 HP
      const leaderEid = addEntity(world);
      addComponent(world, PlayerControlled, leaderEid);
      addComponent(world, Health, leaderEid);
      Health.max[leaderEid] = 100;
      Health.current[leaderEid] = 0; // Death trigger!

      addComponent(world, Position, leaderEid);
      Position.x[leaderEid] = 500;
      Position.y[leaderEid] = 500;

      addComponent(world, FSMState, leaderEid);
      FSMState.state[leaderEid] = FSMStateValues.IDLE;

      addComponent(world, RunSpoilsComponent, leaderEid);
      RunSpoilsComponent.spoils[leaderEid] = 200;

      // 3. Run System
      system(world, 16);

      // 4. Assertions
      // Health restored to 25% max
      expect(Health.current[leaderEid]).toBe(25);

      // FSM state is FLEE and targets CampCore
      expect(FSMState.state[leaderEid]).toBe(FSMStateValues.FLEE);
      expect(FSMState.targetEntity[leaderEid]).toBe(coreEid);

      // Position is reset to camp core position
      expect(Position.x[leaderEid]).toBe(150);
      expect(Position.y[leaderEid]).toBe(200);

      // Run spoils are halved
      expect(RunSpoilsComponent.spoils[leaderEid]).toBe(100);

      // SoftFailRetreat component is added
      expect(hasComponent(world, SoftFailRetreatComponent, leaderEid)).toBe(true);
      expect(SoftFailRetreatComponent.isRetreating[leaderEid]).toBe(1);
    });

    it("should ignore PlayerControlled entities that have health > 0", () => {
      const coreEid = addEntity(world);
      addComponent(world, CampCoreComponent, coreEid);
      addComponent(world, Position, coreEid);

      const leaderEid = addEntity(world);
      addComponent(world, PlayerControlled, leaderEid);
      addComponent(world, Health, leaderEid);
      Health.max[leaderEid] = 100;
      Health.current[leaderEid] = 50; // Alive!

      addComponent(world, FSMState, leaderEid);
      FSMState.state[leaderEid] = FSMStateValues.IDLE;

      system(world, 16);

      // Health remains 50
      expect(Health.current[leaderEid]).toBe(50);

      // State is still IDLE
      expect(FSMState.state[leaderEid]).toBe(FSMStateValues.IDLE);

      // No retreat component
      expect(hasComponent(world, SoftFailRetreatComponent, leaderEid)).toBe(false);
    });
  });

});