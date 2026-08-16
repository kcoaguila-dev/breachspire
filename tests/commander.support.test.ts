import { describe, it, expect, beforeEach } from "vitest";
import { createWorld, addEntity, addComponent } from "bitecs";
import {
  canAffordSupportAction,
  calculateRepairAmount,
  createCommanderSupportSystem
} from "../src/ecs/systems/CommanderSupportSystem";
import {
  CommanderTag,
  CampCoreComponent,
  SupportRequestComponent,
  CampWallComponent,
  SupportActionEnum,
  Health,
  Speed
} from "../src/ecs/components";

describe("Commander Support System", () => {

  describe("canAffordSupportAction", () => {
    it("should return true if current energy is greater than cost", () => {
      expect(canAffordSupportAction(100, 50)).toBe(true);
    });

    it("should return true if current energy is exactly equal to cost", () => {
      expect(canAffordSupportAction(50, 50)).toBe(true);
    });

    it("should return false if current energy is less than cost", () => {
      expect(canAffordSupportAction(25, 50)).toBe(false);
    });
  });

  describe("calculateRepairAmount", () => {
    it("should calculate correct amount when not exceeding max HP", () => {
      // Current HP 50, Max HP 100, Repair 30 -> Should repair 30
      expect(calculateRepairAmount(50, 100, 30)).toBe(30);
    });

    it("should cap the repair amount to not exceed max HP", () => {
      // Current HP 80, Max HP 100, Repair 50 -> Should only repair 20
      expect(calculateRepairAmount(80, 100, 50)).toBe(20);
    });

    it("should return 0 if already at max HP", () => {
      expect(calculateRepairAmount(100, 100, 50)).toBe(0);
    });
  });

  describe("System Factory: createCommanderSupportSystem", () => {
    let world: any;
    let system: any;
    let coreEid: number;
    let commanderEid: number;

    beforeEach(() => {
      world = createWorld();
      system = createCommanderSupportSystem();

      coreEid = addEntity(world);
      addComponent(world, CampCoreComponent, coreEid);
      CampCoreComponent.lightEnergy[coreEid] = 500;

      commanderEid = addEntity(world);
      addComponent(world, CommanderTag, commanderEid);
      addComponent(world, SupportRequestComponent, commanderEid);
    });

    it("should execute RallyFlag action and deduct energy", () => {
      const heroEid = addEntity(world);
      addComponent(world, Speed, heroEid);
      Speed.value[heroEid] = 100;

      SupportRequestComponent.requested[commanderEid] = 1;
      SupportRequestComponent.actionType[commanderEid] = SupportActionEnum.RallyFlag;
      SupportRequestComponent.targetEid[commanderEid] = heroEid;

      system(world, 16);

      // Energy deducted (500 - 50 = 450)
      expect(CampCoreComponent.lightEnergy[coreEid]).toBe(450);

      // Speed increased (+50)
      expect(Speed.value[heroEid]).toBe(150);

      // Request cleared
      expect(SupportRequestComponent.requested[commanderEid]).toBe(0);
    });

    it("should execute RepairWall action and deduct energy", () => {
      const wallEid = addEntity(world);
      addComponent(world, CampWallComponent, wallEid);
      addComponent(world, Health, wallEid);
      Health.max[wallEid] = 1000;
      Health.current[wallEid] = 200;

      SupportRequestComponent.requested[commanderEid] = 1;
      SupportRequestComponent.actionType[commanderEid] = SupportActionEnum.RepairWall;
      SupportRequestComponent.targetEid[commanderEid] = wallEid;

      system(world, 16);

      // Energy deducted (500 - 75 = 425)
      expect(CampCoreComponent.lightEnergy[coreEid]).toBe(425);

      // Wall HP increased (200 + 500 repair = 700)
      expect(Health.current[wallEid]).toBe(700);

      // Request cleared
      expect(SupportRequestComponent.requested[commanderEid]).toBe(0);
    });

    it("should not execute action if energy is insufficient", () => {
      CampCoreComponent.lightEnergy[coreEid] = 25; // Less than cost of 50

      const heroEid = addEntity(world);
      addComponent(world, Speed, heroEid);
      Speed.value[heroEid] = 100;

      SupportRequestComponent.requested[commanderEid] = 1;
      SupportRequestComponent.actionType[commanderEid] = SupportActionEnum.RallyFlag;
      SupportRequestComponent.targetEid[commanderEid] = heroEid;

      system(world, 16);

      // Energy not deducted
      expect(CampCoreComponent.lightEnergy[coreEid]).toBe(25);

      // Speed not increased
      expect(Speed.value[heroEid]).toBe(100);

      // Request not cleared (remains pending until affordable or cancelled externally)
      expect(SupportRequestComponent.requested[commanderEid]).toBe(1);
    });
  });

});