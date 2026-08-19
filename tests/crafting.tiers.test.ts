import { describe, it, expect } from "vitest";
import { computeWallUpgradeCost, calculateThornsDamage, createBuildingSystem } from "../src/ecs/systems/BuildingSystem";
import { computeWatchtowerRange, computeWatchtowerAttackCooldown, canOccupyWatchtower, createWatchtowerSystem } from "../src/ecs/systems/WatchtowerSystem";
import { createWorld, addEntity, addComponent } from "bitecs";
import { Position, CampWallComponent, WallTierValues, WatchtowerComponent, UnitRole, RoleValues, Health, Speed, CampCoreComponent, CampStockComponent, WallBlueprint, BlueprintStateValues, PlayerControlled, InputStateComponent, Velocity } from "../src/ecs/components";

describe("Tiered Crafting & Building Upgrades", () => {
  describe("computeWallUpgradeCost", () => {
    it("should return correct cost for Tier 0 (mound to wood palisade)", () => {
      const cost = computeWallUpgradeCost(0);
      expect(cost).not.toBeNull();
      expect(cost!.aether).toBe(5);
      expect(cost!.wood).toBe(0);
      expect(cost!.iron).toBe(0);
      expect(cost!.hp).toBe(60);
    });

    it("should return correct cost for Tier 1 (wood to stone wall)", () => {
      const cost = computeWallUpgradeCost(1);
      expect(cost).not.toBeNull();
      expect(cost!.aether).toBe(10);
      expect(cost!.wood).toBe(5);
      expect(cost!.iron).toBe(2);
      expect(cost!.hp).toBe(120);
    });

    it("should return correct cost for Tier 2 (stone to iron spiked rampart)", () => {
      const cost = computeWallUpgradeCost(2);
      expect(cost).not.toBeNull();
      expect(cost!.aether).toBe(15);
      expect(cost!.wood).toBe(0);
      expect(cost!.iron).toBe(5);
      expect(cost!.hp).toBe(200);
    });

    it("should return null for Tier 3 (max tier reached)", () => {
      expect(computeWallUpgradeCost(3)).toBeNull();
    });
  });

  describe("calculateThornsDamage", () => {
    it("should reflect 10 thorns damage for Tier 3 Iron Spiked wall", () => {
      expect(calculateThornsDamage(WallTierValues.IronSpikes, 25)).toBe(10);
      expect(calculateThornsDamage(3, 10)).toBe(10);
    });

    it("should reflect 0 thorns damage for Tier 1 or Tier 2 walls", () => {
      expect(calculateThornsDamage(WallTierValues.PalisadeWood, 25)).toBe(0);
      expect(calculateThornsDamage(WallTierValues.MasonryStone, 25)).toBe(0);
      expect(calculateThornsDamage(1, 25)).toBe(0);
      expect(calculateThornsDamage(2, 25)).toBe(0);
    });

    it("should reflect 0 thorns damage if incoming damage is 0", () => {
      expect(calculateThornsDamage(WallTierValues.IronSpikes, 0)).toBe(0);
    });
  });

  describe("Watchtower Pure Logic", () => {
    it("should grant +50% range bonus when stationed in watchtower", () => {
      const baseRange = 200;
      expect(computeWatchtowerRange(baseRange, true)).toBe(300);
      expect(computeWatchtowerRange(baseRange, false)).toBe(200);
    });

    it("should grant +30% attack speed (0.7x cooldown) when stationed in watchtower", () => {
      const baseCooldown = 1000;
      expect(computeWatchtowerAttackCooldown(baseCooldown, true)).toBe(700);
      expect(computeWatchtowerAttackCooldown(baseCooldown, false)).toBe(1000);
    });

    it("should correctly evaluate vacant vs occupied watchtower", () => {
      expect(canOccupyWatchtower(0)).toBe(true);
      expect(canOccupyWatchtower(-1)).toBe(true);
      expect(canOccupyWatchtower(42)).toBe(false);
    });
  });

  describe("System Integration: Watchtower Archer Stationing", () => {
    it("should auto-station an available archer into a vacant watchtower", () => {
      const world = createWorld();

      const towerEid = addEntity(world);
      addComponent(world, Position, towerEid);
      Position.x[towerEid] = 500;
      Position.y[towerEid] = 300;
      addComponent(world, WatchtowerComponent, towerEid);
      WatchtowerComponent.occupiedArcherEid[towerEid] = 0;

      const archerEid = addEntity(world);
      addComponent(world, Position, archerEid);
      Position.x[archerEid] = 550;
      Position.y[archerEid] = 300;
      addComponent(world, Health, archerEid);
      Health.current[archerEid] = 80;
      addComponent(world, Speed, archerEid);
      Speed.value[archerEid] = 50;
      addComponent(world, UnitRole, archerEid);
      UnitRole.role[archerEid] = RoleValues.ARCHER;

      const watchtowerSystem = createWatchtowerSystem();
      watchtowerSystem(world, 16);

      expect(WatchtowerComponent.occupiedArcherEid[towerEid]).toBe(archerEid);
      expect(Position.x[archerEid]).toBe(500);
      expect(Position.y[archerEid]).toBe(260); // Perched 40px above ground
    });
  });

  describe("System Integration: Multi-Tier Wall Upgrades", () => {
    it("should upgrade a built stone wall to Tier 3 Iron Spikes when player orders it", () => {
      const world = createWorld();

      const coreEid = addEntity(world);
      addComponent(world, CampCoreComponent, coreEid);
      CampCoreComponent.lightEnergy[coreEid] = 50;
      addComponent(world, CampStockComponent, coreEid);
      CampStockComponent.wood[coreEid] = 20;
      CampStockComponent.iron[coreEid] = 10;

      const wallEid = addEntity(world);
      addComponent(world, Position, wallEid);
      Position.x[wallEid] = 200;
      Position.y[wallEid] = 100;
      addComponent(world, CampWallComponent, wallEid);
      CampWallComponent.tier[wallEid] = WallTierValues.MasonryStone; // Tier 2
      CampWallComponent.hp[wallEid] = 120;
      CampWallComponent.maxHp[wallEid] = 120;
      addComponent(world, Health, wallEid);
      Health.current[wallEid] = 120;
      Health.max[wallEid] = 120;

      const playerEid = addEntity(world);
      addComponent(world, Position, playerEid);
      Position.x[playerEid] = 200;
      Position.y[playerEid] = 100;
      addComponent(world, PlayerControlled, playerEid);
      addComponent(world, InputStateComponent, playerEid);
      InputStateComponent.attack[playerEid] = 1; // Press Space

      const buildingSystem = createBuildingSystem();
      buildingSystem(world, 16);

      // Should have deducted Tier 3 cost (15 Aether, 5 Iron)
      expect(CampCoreComponent.lightEnergy[coreEid]).toBe(35);
      expect(CampStockComponent.iron[coreEid]).toBe(5);
      expect(WallBlueprint.state[wallEid]).toBe(BlueprintStateValues.ORDERED);
      expect(WallBlueprint.targetTier[wallEid]).toBe(WallTierValues.IronSpikes);

      // Builder comes to build the upgrade
      const builderEid = addEntity(world);
      addComponent(world, Position, builderEid);
      Position.x[builderEid] = 200;
      Position.y[builderEid] = 100;
      addComponent(world, Velocity, builderEid);
      addComponent(world, Speed, builderEid);
      Speed.value[builderEid] = 50;
      addComponent(world, Health, builderEid);
      Health.current[builderEid] = 100;
      addComponent(world, UnitRole, builderEid);
      UnitRole.role[builderEid] = RoleValues.BUILDER;
      UnitRole.level[builderEid] = 1;

      // Finish construction
      WallBlueprint.progress[wallEid] = 95;
      buildingSystem(world, 1000);

      expect(CampWallComponent.tier[wallEid]).toBe(WallTierValues.IronSpikes);
      expect(CampWallComponent.hp[wallEid]).toBe(200);
      expect(CampWallComponent.maxHp[wallEid]).toBe(200);
      expect(Health.current[wallEid]).toBe(200);
    });
  });
});
