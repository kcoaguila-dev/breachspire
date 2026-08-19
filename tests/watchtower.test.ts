import { describe, it, expect } from "vitest";
import {
  computeTowerUpgradeCost,
  computeTowerPerchHeight,
  computeWatchtowerRange,
  computeWatchtowerAttackCooldown,
  canGarrisonTower,
  createWatchtowerSystem
} from "../src/ecs/systems/WatchtowerSystem";
import { createWorld, addEntity, addComponent } from "bitecs";
import {
  Position,
  WatchtowerComponent,
  TowerStateValues,
  TowerTierValues,
  UnitRole,
  RoleValues,
  Health,
  Speed,
  Velocity,
  PlayerControlled,
  InputStateComponent,
  CampCoreComponent,
  CampStockComponent
} from "../src/ecs/components";
import { createWatchtowerEntity } from "../src/ecs/world";

describe("Watchtower System (Kingdom Two Crowns Scale & Mechanics)", () => {
  describe("Pure Logic: Costs, Perch Heights & Scaling Capacity", () => {
    it("should compute correct upgrade costs and capacity for all tiers", () => {
      // Tier 0 (Rubble) -> Tier 1 (Wooden)
      const t0 = computeTowerUpgradeCost(TowerTierValues.RUBBLE);
      expect(t0).not.toBeNull();
      expect(t0!.nextTier).toBe(TowerTierValues.WOODEN);
      expect(t0!.nextMaxGarrison).toBe(1);
      expect(t0!.aether).toBe(5);
      expect(t0!.wood).toBe(10);
      expect(t0!.iron).toBe(0);

      // Tier 1 -> Tier 2 (Bastion)
      const t1 = computeTowerUpgradeCost(TowerTierValues.WOODEN);
      expect(t1).not.toBeNull();
      expect(t1!.nextTier).toBe(TowerTierValues.BASTION);
      expect(t1!.nextMaxGarrison).toBe(2);
      expect(t1!.aether).toBe(10);
      expect(t1!.wood).toBe(25);

      // Tier 2 -> Tier 3 (Fortress)
      const t2 = computeTowerUpgradeCost(TowerTierValues.BASTION);
      expect(t2).not.toBeNull();
      expect(t2!.nextTier).toBe(TowerTierValues.FORTRESS);
      expect(t2!.nextMaxGarrison).toBe(3);
      expect(t2!.aether).toBe(15);
      expect(t2!.wood).toBe(50);
      expect(t2!.iron).toBe(15);

      // Tier 3 (Max)
      const t3 = computeTowerUpgradeCost(TowerTierValues.FORTRESS);
      expect(t3).toBeNull();
    });

    it("should compute elevated perch height for archers", () => {
      expect(computeTowerPerchHeight(TowerTierValues.WOODEN)).toBe(95);
      expect(computeTowerPerchHeight(TowerTierValues.BASTION)).toBe(135);
      expect(computeTowerPerchHeight(TowerTierValues.FORTRESS)).toBe(175);
    });

    it("should grant range and attack speed bonuses to stationed archers", () => {
      const baseRange = 200;
      const baseCooldown = 1000;

      expect(computeWatchtowerRange(baseRange, false)).toBe(200);
      expect(computeWatchtowerRange(baseRange, true)).toBeCloseTo(300); // +50%

      expect(computeWatchtowerAttackCooldown(baseCooldown, false)).toBe(1000);
      expect(computeWatchtowerAttackCooldown(baseCooldown, true)).toBe(700); // 30% faster
    });

    it("should check garrison capacity correctly", () => {
      expect(canGarrisonTower(0, 1)).toBe(true);
      expect(canGarrisonTower(1, 1)).toBe(false);
      expect(canGarrisonTower(1, 2)).toBe(true);
      expect(canGarrisonTower(2, 2)).toBe(false);
      expect(canGarrisonTower(2, 3)).toBe(true);
      expect(canGarrisonTower(3, 3)).toBe(false);
    });
  });

  describe("ECS Integration: Builder Construction & Archer Garrisoning", () => {
    it("should order tower construction from rubble pile when player interacts", () => {
      const world = createWorld();

      // Camp Core with 50 Aether and 50 Wood
      const coreEid = addEntity(world);
      addComponent(world, CampCoreComponent, coreEid);
      CampCoreComponent.lightEnergy[coreEid] = 50;
      addComponent(world, CampStockComponent, coreEid);
      CampStockComponent.wood[coreEid] = 50;
      addComponent(world, Position, coreEid);
      Position.x[coreEid] = 16000;
      Position.y[coreEid] = 650;

      // Rubble Watchtower at x=14500
      const towerEid = createWatchtowerEntity(world, 14500, 650, TowerTierValues.RUBBLE);

      // Player at x=14510 pressing Space
      const playerEid = addEntity(world);
      addComponent(world, PlayerControlled, playerEid);
      addComponent(world, InputStateComponent, playerEid);
      InputStateComponent.attack[playerEid] = 1;
      addComponent(world, Position, playerEid);
      Position.x[playerEid] = 14510;
      Position.y[playerEid] = 650;

      const watchtowerSystem = createWatchtowerSystem();
      watchtowerSystem(world, 16);

      // Verify resources deducted (5 Aether, 10 Wood)
      expect(CampCoreComponent.lightEnergy[coreEid]).toBe(45);
      expect(CampStockComponent.wood[coreEid]).toBe(40);

      // Verify Tower is in ORDERED state
      expect(WatchtowerComponent.state[towerEid]).toBe(TowerStateValues.ORDERED);
    });

    it("should have a builder run to tower and construct it to completion", () => {
      const world = createWorld();

      const coreEid = addEntity(world);
      addComponent(world, CampCoreComponent, coreEid);
      addComponent(world, Position, coreEid);
      Position.x[coreEid] = 16000;

      // Ordered Tower at x=14500
      const towerEid = createWatchtowerEntity(world, 14500, 650, TowerTierValues.RUBBLE);
      WatchtowerComponent.state[towerEid] = TowerStateValues.ORDERED;

      // Builder near tower
      const builderEid = addEntity(world);
      addComponent(world, Position, builderEid);
      Position.x[builderEid] = 14510; // Within 25px
      Position.y[builderEid] = 650;
      addComponent(world, Velocity, builderEid);
      addComponent(world, Speed, builderEid);
      Speed.value[builderEid] = 60;
      addComponent(world, Health, builderEid);
      Health.max[builderEid] = 60;
      Health.current[builderEid] = 60;
      addComponent(world, UnitRole, builderEid);
      UnitRole.role[builderEid] = RoleValues.BUILDER;
      UnitRole.isConstructing[builderEid] = 0;

      const watchtowerSystem = createWatchtowerSystem();

      // Run 5 seconds (5000ms) of construction
      watchtowerSystem(world, 5000);

      // Verify Tower completed to Level 1 Wooden Watchtower
      expect(WatchtowerComponent.state[towerEid]).toBe(TowerStateValues.COMPLETED);
      expect(WatchtowerComponent.tier[towerEid]).toBe(TowerTierValues.WOODEN);
      expect(WatchtowerComponent.maxGarrison[towerEid]).toBe(1);
      expect(WatchtowerComponent.progress[towerEid]).toBe(100);
      expect(UnitRole.isConstructing[builderEid]).toBe(0);
    });

    it("should station nearest archer atop tower when player assigns them", () => {
      const world = createWorld();

      const coreEid = addEntity(world);
      addComponent(world, CampCoreComponent, coreEid);
      addComponent(world, Position, coreEid);
      Position.x[coreEid] = 16000;

      // Completed Tier 1 Tower at x=14500
      const towerEid = createWatchtowerEntity(world, 14500, 650, TowerTierValues.WOODEN);
      WatchtowerComponent.state[towerEid] = TowerStateValues.COMPLETED;
      WatchtowerComponent.maxGarrison[towerEid] = 1;
      WatchtowerComponent.garrisonCount[towerEid] = 0;

      // Idle Archer nearby
      const archerEid = addEntity(world);
      addComponent(world, Position, archerEid);
      Position.x[archerEid] = 14520;
      Position.y[archerEid] = 650;
      addComponent(world, Velocity, archerEid);
      addComponent(world, Speed, archerEid);
      Speed.value[archerEid] = 50;
      addComponent(world, Health, archerEid);
      Health.max[archerEid] = 80;
      Health.current[archerEid] = 80;
      addComponent(world, UnitRole, archerEid);
      UnitRole.role[archerEid] = RoleValues.ARCHER;

      // Player at tower pressing Space
      const playerEid = addEntity(world);
      addComponent(world, PlayerControlled, playerEid);
      addComponent(world, InputStateComponent, playerEid);
      InputStateComponent.attack[playerEid] = 1;
      addComponent(world, Position, playerEid);
      Position.x[playerEid] = 14505;
      Position.y[playerEid] = 650;

      const watchtowerSystem = createWatchtowerSystem();
      watchtowerSystem(world, 16);

      // Verify Archer assigned to slot 1 and garrison count is 1
      expect(WatchtowerComponent.garrisonCount[towerEid]).toBe(1);
      expect(WatchtowerComponent.archer1Eid[towerEid]).toBe(archerEid);

      // Verify Archer elevated to perch
      expect(Position.x[archerEid]).toBe(14500);
      expect(Position.y[archerEid]).toBe(650 - 95); // Elevated perch at y=555
    });
  });
});
