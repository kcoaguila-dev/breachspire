import { describe, it, expect, beforeEach } from "vitest";
import { createWorld, addEntity, addComponent } from "bitecs";
import {
  createLeaderDeathSystem
} from "../src/ecs/systems/LeaderDeathSystem";
import { isLeaderDead } from "../src/ecs/systems/GameStateSystem";
import {
  PlayerControlled,
  Health,
  FSMState,
  FSMStateValues,
  Position,
  CampCoreComponent,
  RunSpoilsComponent
} from "../src/ecs/components";

describe("Leader Death Logic", () => {
  describe("Pure Logic: isLeaderDead", () => {
    it("should return true if HP is 0", () => {
      expect(isLeaderDead(0)).toBe(true);
    });

    it("should return true if HP is negative", () => {
      expect(isLeaderDead(-10)).toBe(true);
    });

    it("should return false if HP is > 0", () => {
      expect(isLeaderDead(10)).toBe(false);
    });
  });

  describe("System Factory: createLeaderDeathSystem", () => {
    let world: any;
    let system: any;

    beforeEach(() => {
      world = createWorld();
      system = createLeaderDeathSystem();
    });

    it("should not alter player health or state (handled by GameStateSystem now)", () => {
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
      // Health remains 0
      expect(Health.current[leaderEid]).toBe(0);

      // FSM state remains IDLE
      expect(FSMState.state[leaderEid]).toBe(FSMStateValues.IDLE);

      // Position remains unchanged
      expect(Position.x[leaderEid]).toBe(500);
      expect(Position.y[leaderEid]).toBe(500);

      // Run spoils remain 200
      expect(RunSpoilsComponent.spoils[leaderEid]).toBe(200);
    });
  });

});
