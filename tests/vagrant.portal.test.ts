import { describe, it, expect } from "vitest";
import { canPortalSpawn, computeVagrantsToSpawn, createVagrantPortalSystem } from "../src/ecs/systems/VagrantPortalSystem";
import { createWorld, addEntity, addComponent, defineQuery } from "bitecs";
import {
  Position,
  WildernessPoiComponent,
  UnitRole,
  RoleValues,
  CampCoreComponent,
  Velocity,
  Speed,
  Health,
  FactionTag,
  FactionValues,
  DayNightCycle,
  PlayerControlled,
  InputStateComponent
} from "../src/ecs/components";
import { createRecruitmentSystem } from "../src/ecs/systems/RecruitmentSystem";

describe("Vagrant Portal System (Kingdom Beggar Camp Mechanics)", () => {
  describe("Pure Logic: canPortalSpawn & computeVagrantsToSpawn", () => {
    it("should allow spawning when current vagrants is less than cap of 4", () => {
      expect(canPortalSpawn(0, 4)).toBe(true);
      expect(canPortalSpawn(2, 4)).toBe(true);
      expect(canPortalSpawn(3, 4)).toBe(true);
    });

    it("should not allow spawning when portal already has 4 vagrants", () => {
      expect(canPortalSpawn(4, 4)).toBe(false);
      expect(canPortalSpawn(5, 4)).toBe(false);
    });

    it("should compute correct number of vagrants to spawn without exceeding cap", () => {
      expect(computeVagrantsToSpawn(0, 4, 2)).toBe(2);
      expect(computeVagrantsToSpawn(2, 4, 2)).toBe(2);
      expect(computeVagrantsToSpawn(3, 4, 2)).toBe(1); // capped at 4
      expect(computeVagrantsToSpawn(4, 4, 2)).toBe(0); // full
    });
  });

  describe("ECS Integration: Recruitment & Guidance to Camp Core", () => {
    it("should recruit a grayish vagrant at portal for 5 Energy and guide them to camp core", () => {
      const world = createWorld();

      // Camp Core with 50 Light Energy at x=16000
      const coreEid = addEntity(world);
      addComponent(world, CampCoreComponent, coreEid);
      CampCoreComponent.lightEnergy[coreEid] = 50;
      addComponent(world, Position, coreEid);
      Position.x[coreEid] = 16000;
      Position.y[coreEid] = 650;

      // Waygate Portal (POI Type 3) at x=12500
      const portalEid = addEntity(world);
      addComponent(world, WildernessPoiComponent, portalEid);
      WildernessPoiComponent.poiType[portalEid] = 3;
      addComponent(world, Position, portalEid);
      Position.x[portalEid] = 12500;
      Position.y[portalEid] = 650;

      // Grayish Vagrant sitting at portal
      const vagrantEid = addEntity(world);
      addComponent(world, Position, vagrantEid);
      Position.x[vagrantEid] = 12510;
      Position.y[vagrantEid] = 650;
      addComponent(world, Velocity, vagrantEid);
      Velocity.x[vagrantEid] = 0;
      addComponent(world, Speed, vagrantEid);
      Speed.value[vagrantEid] = 40;
      addComponent(world, Health, vagrantEid);
      Health.max[vagrantEid] = 40;
      Health.current[vagrantEid] = 40;
      addComponent(world, FactionTag, vagrantEid);
      FactionTag.faction[vagrantEid] = FactionValues.Hero;
      addComponent(world, UnitRole, vagrantEid);
      UnitRole.role[vagrantEid] = RoleValues.VAGRANT;

      // Player visiting portal and pressing Space (attack=1)
      const playerEid = addEntity(world);
      addComponent(world, PlayerControlled, playerEid);
      addComponent(world, InputStateComponent, playerEid);
      InputStateComponent.attack[playerEid] = 1;
      addComponent(world, Position, playerEid);
      Position.x[playerEid] = 12505;
      Position.y[playerEid] = 650;

      // Run Recruitment System
      const recruitmentSystem = createRecruitmentSystem();
      recruitmentSystem(world, 16);

      // Verify Energy deducted from 50 to 45
      expect(CampCoreComponent.lightEnergy[coreEid]).toBe(45);

      // Verify Vagrant converted to PEASANT (Citizen) and walking right towards x=16000
      expect(UnitRole.role[vagrantEid]).toBe(RoleValues.PEASANT);
      expect(Health.current[vagrantEid]).toBe(50);
      expect(Velocity.x[vagrantEid]).toBeGreaterThan(0); // Heading east toward camp core
    });

    it("should assign tool to waiting peasant when player visits Tool Stand", () => {
      const world = createWorld();

      // Camp Core at x=16000 with 30 Energy
      const coreEid = addEntity(world);
      addComponent(world, CampCoreComponent, coreEid);
      CampCoreComponent.lightEnergy[coreEid] = 30;
      addComponent(world, Position, coreEid);
      Position.x[coreEid] = 16000;
      Position.y[coreEid] = 650;

      // Bow Stand (POI Type 5) at x=16050
      const bowStandEid = addEntity(world);
      addComponent(world, WildernessPoiComponent, bowStandEid);
      WildernessPoiComponent.poiType[bowStandEid] = 5;
      addComponent(world, Position, bowStandEid);
      Position.x[bowStandEid] = 16050;
      Position.y[bowStandEid] = 650;

      // Unemployed Peasant at camp center
      const peasantEid = addEntity(world);
      addComponent(world, Position, peasantEid);
      Position.x[peasantEid] = 16040;
      Position.y[peasantEid] = 650;
      addComponent(world, Velocity, peasantEid);
      addComponent(world, Speed, peasantEid);
      Speed.value[peasantEid] = 40;
      addComponent(world, Health, peasantEid);
      Health.max[peasantEid] = 50;
      Health.current[peasantEid] = 50;
      addComponent(world, FactionTag, peasantEid);
      FactionTag.faction[peasantEid] = FactionValues.Hero;
      addComponent(world, UnitRole, peasantEid);
      UnitRole.role[peasantEid] = RoleValues.PEASANT;

      // Player at Bow Stand pressing Space
      const playerEid = addEntity(world);
      addComponent(world, PlayerControlled, playerEid);
      addComponent(world, InputStateComponent, playerEid);
      InputStateComponent.attack[playerEid] = 1;
      addComponent(world, Position, playerEid);
      Position.x[playerEid] = 16050;
      Position.y[playerEid] = 650;

      // Run Recruitment System
      const recruitmentSystem = createRecruitmentSystem();
      recruitmentSystem(world, 16);

      // Verify Bow hire cost (15 Aether) deducted: 30 - 15 = 15
      expect(CampCoreComponent.lightEnergy[coreEid]).toBe(15);

      // Verify Peasant promoted to ARCHER
      expect(UnitRole.role[peasantEid]).toBe(RoleValues.ARCHER);
      expect(Health.max[peasantEid]).toBe(80);
    });

    it("should spawn 1-2 vagrants at dawn at waygate portals when under cap of 4", () => {
      const world = createWorld();

      // Day Night Cycle at Day 2 Dawn
      const dayEid = addEntity(world);
      addComponent(world, DayNightCycle, dayEid);
      DayNightCycle.dayNumber[dayEid] = 2;
      DayNightCycle.isNight[dayEid] = 0;

      // Camp Core
      const coreEid = addEntity(world);
      addComponent(world, CampCoreComponent, coreEid);
      addComponent(world, Position, coreEid);
      Position.x[coreEid] = 16000;
      Position.y[coreEid] = 650;

      // Waygate Portal (POI Type 3)
      const portalEid = addEntity(world);
      addComponent(world, WildernessPoiComponent, portalEid);
      WildernessPoiComponent.poiType[portalEid] = 3;
      addComponent(world, Position, portalEid);
      Position.x[portalEid] = 12500;
      Position.y[portalEid] = 650;

      const portalSystem = createVagrantPortalSystem();
      portalSystem(world, 16);

      // Verify vagrants were spawned
      const vagrantQuery = defineQuery([UnitRole, Position, Health]);
      const vagrants = vagrantQuery(world);

      expect(vagrants.length).toBeGreaterThanOrEqual(1);
      expect(vagrants.length).toBeLessThanOrEqual(2);
      expect(UnitRole.role[vagrants[0]]).toBe(RoleValues.VAGRANT);
    });
  });
});
