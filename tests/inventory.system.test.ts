import { describe, it, expect } from "vitest";
import {
  computeInventoryUpgradeCost,
  clampResource,
  canAffordInventoryUpgrade,
  createInventorySystem
} from "../src/ecs/systems/InventorySystem";
import { createWorld, addEntity, addComponent } from "bitecs";
import {
  Position,
  CampCoreComponent,
  CampStockComponent,
  WildernessPoiComponent,
  PoiTypeValues,
  PlayerControlled,
  InputStateComponent
} from "../src/ecs/components";

describe("Inventory System & Resource Capacity", () => {
  describe("computeInventoryUpgradeCost (Pure Logic)", () => {
    it("should return correct cost and capacities for Level 0 -> 1 (Timber Stockpile)", () => {
      const upgrade = computeInventoryUpgradeCost(0);
      expect(upgrade).not.toBeNull();
      expect(upgrade!.woodCost).toBe(10);
      expect(upgrade!.newMaxWood).toBe(50);
      expect(upgrade!.newMaxIron).toBe(25);
    });

    it("should return correct cost and capacities for Level 1 -> 2 (Reinforced Warehouse)", () => {
      const upgrade = computeInventoryUpgradeCost(1);
      expect(upgrade).not.toBeNull();
      expect(upgrade!.woodCost).toBe(25);
      expect(upgrade!.newMaxWood).toBe(120);
      expect(upgrade!.newMaxIron).toBe(60);
    });

    it("should return correct cost and capacities for Level 2 -> 3 (Grand Royal Silo)", () => {
      const upgrade = computeInventoryUpgradeCost(2);
      expect(upgrade).not.toBeNull();
      expect(upgrade!.woodCost).toBe(50);
      expect(upgrade!.newMaxWood).toBe(300);
      expect(upgrade!.newMaxIron).toBe(150);
    });

    it("should return null for Level 3+ (Max level reached)", () => {
      expect(computeInventoryUpgradeCost(3)).toBeNull();
      expect(computeInventoryUpgradeCost(4)).toBeNull();
    });
  });

  describe("clampResource (Pure Logic)", () => {
    it("should add yield correctly when below max capacity", () => {
      expect(clampResource(5, 10, 20)).toBe(15);
    });

    it("should clamp at max capacity when overflow occurs", () => {
      expect(clampResource(18, 10, 20)).toBe(20);
    });
  });

  describe("canAffordInventoryUpgrade (Pure Logic)", () => {
    it("should return true if player has sufficient wood", () => {
      expect(canAffordInventoryUpgrade(15, 10)).toBe(true);
      expect(canAffordInventoryUpgrade(10, 10)).toBe(true);
    });

    it("should return false if player has insufficient wood", () => {
      expect(canAffordInventoryUpgrade(8, 10)).toBe(false);
    });
  });

  describe("System Integration: Warehouse Stockpile Upgrades", () => {
    it("should deduct wood and upgrade maxWood/maxIron while leaving energy untouched", () => {
      const world = createWorld();

      // Camp Core (Initial state: 100 energy, 100 maxEnergy, 15 wood, 20 maxWood, 10 maxIron, Lv.0)
      const coreEid = addEntity(world);
      addComponent(world, Position, coreEid);
      Position.x[coreEid] = 16000;
      Position.y[coreEid] = 650;

      addComponent(world, CampCoreComponent, coreEid);
      CampCoreComponent.lightEnergy[coreEid] = 100;
      CampCoreComponent.maxEnergy[coreEid] = 100;

      addComponent(world, CampStockComponent, coreEid);
      CampStockComponent.wood[coreEid] = 15;
      CampStockComponent.iron[coreEid] = 5;
      CampStockComponent.maxWood[coreEid] = 20;
      CampStockComponent.maxIron[coreEid] = 10;
      CampStockComponent.inventoryLevel[coreEid] = 0;

      // Warehouse POI at x=16200
      const warehouseEid = addEntity(world);
      addComponent(world, Position, warehouseEid);
      Position.x[warehouseEid] = 16200;
      Position.y[warehouseEid] = 650;
      addComponent(world, WildernessPoiComponent, warehouseEid);
      WildernessPoiComponent.poiType[warehouseEid] = PoiTypeValues.Warehouse;

      // Player standing at Warehouse pressing Space
      const playerEid = addEntity(world);
      addComponent(world, Position, playerEid);
      Position.x[playerEid] = 16200;
      Position.y[playerEid] = 650;
      addComponent(world, PlayerControlled, playerEid);
      addComponent(world, InputStateComponent, playerEid);
      InputStateComponent.attack[playerEid] = 1; // Press Space

      const inventorySystem = createInventorySystem();
      inventorySystem(world, 16);

      // Verify Wood was deducted (15 - 10 = 5)
      expect(CampStockComponent.wood[coreEid]).toBe(5);

      // Verify Inventory Level upgraded to 1
      expect(CampStockComponent.inventoryLevel[coreEid]).toBe(1);

      // Verify Resource Capacities increased
      expect(CampStockComponent.maxWood[coreEid]).toBe(50);
      expect(CampStockComponent.maxIron[coreEid]).toBe(25);

      // CRITICAL: Verify Light Energy was completely UNTOUCHED
      expect(CampCoreComponent.lightEnergy[coreEid]).toBe(100);
      expect(CampCoreComponent.maxEnergy[coreEid]).toBe(100);
    });

    it("should prevent upgrade if insufficient wood", () => {
      const world = createWorld();

      const coreEid = addEntity(world);
      addComponent(world, Position, coreEid);
      Position.x[coreEid] = 16000;
      Position.y[coreEid] = 650;

      addComponent(world, CampCoreComponent, coreEid);
      CampCoreComponent.lightEnergy[coreEid] = 100;
      CampCoreComponent.maxEnergy[coreEid] = 100;

      addComponent(world, CampStockComponent, coreEid);
      CampStockComponent.wood[coreEid] = 5; // Only 5 wood (needs 10)
      CampStockComponent.maxWood[coreEid] = 20;
      CampStockComponent.maxIron[coreEid] = 10;
      CampStockComponent.inventoryLevel[coreEid] = 0;

      const warehouseEid = addEntity(world);
      addComponent(world, Position, warehouseEid);
      Position.x[warehouseEid] = 16200;
      Position.y[warehouseEid] = 650;
      addComponent(world, WildernessPoiComponent, warehouseEid);
      WildernessPoiComponent.poiType[warehouseEid] = PoiTypeValues.Warehouse;

      const playerEid = addEntity(world);
      addComponent(world, Position, playerEid);
      Position.x[playerEid] = 16200;
      Position.y[playerEid] = 650;
      addComponent(world, PlayerControlled, playerEid);
      addComponent(world, InputStateComponent, playerEid);
      InputStateComponent.attack[playerEid] = 1;

      const inventorySystem = createInventorySystem();
      inventorySystem(world, 16);

      // Wood and capacities should remain unchanged
      expect(CampStockComponent.wood[coreEid]).toBe(5);
      expect(CampStockComponent.inventoryLevel[coreEid]).toBe(0);
      expect(CampStockComponent.maxWood[coreEid]).toBe(20);
      expect(CampStockComponent.maxIron[coreEid]).toBe(10);
    });
  });
});
