import { describe, it, expect } from 'vitest';
import { canAffordRecruitment, createRecruitmentSystem } from '../src/ecs/systems/RecruitmentSystem';
import { computeXpGain } from '../src/ecs/systems/ProgressionXPSystem';
import { createWorld, addEntity, addComponent } from 'bitecs';
import { Position, WildernessPoiComponent, UnitRole, RoleValues, CampCoreComponent, PlayerControlled, InputStateComponent, Velocity, Speed, FactionValues, FactionTag, Health, CombatTypeComponent, CombatTypeValues, Attack } from '../src/ecs/components';

describe('Recruitment System', () => {
  it('should return true if energy is greater than or equal to cost', () => {
    expect(canAffordRecruitment(10, 5)).toBe(true);
    expect(canAffordRecruitment(5, 5)).toBe(true);
  });

  it('should return false if energy is less than cost', () => {
    expect(canAffordRecruitment(4, 5)).toBe(false);
  });

  it('should upgrade unemployed peasant to Builder (75 HP) when player presses Space at Hammer Stand', () => {
    const world = createWorld();

    // Camp Core with 50 energy
    const coreEid = addEntity(world);
    addComponent(world, CampCoreComponent, coreEid);
    CampCoreComponent.lightEnergy[coreEid] = 50;
    addComponent(world, Position, coreEid);
    Position.x[coreEid] = 1600;
    Position.y[coreEid] = 650;

    // Hammer Stand at x=1750
    const poiEid = addEntity(world);
    addComponent(world, Position, poiEid);
    Position.x[poiEid] = 1750;
    Position.y[poiEid] = 650;
    addComponent(world, WildernessPoiComponent, poiEid);
    WildernessPoiComponent.poiType[poiEid] = 4; // Hammer Stand

    // Unemployed peasant in town
    const peasantEid = addEntity(world);
    addComponent(world, Position, peasantEid);
    Position.x[peasantEid] = 1650;
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

    // Player standing at Hammer Stand pressing Space
    const playerEid = addEntity(world);
    addComponent(world, Position, playerEid);
    Position.x[playerEid] = 1750;
    Position.y[playerEid] = 650;
    addComponent(world, PlayerControlled, playerEid);
    PlayerControlled.playerId[playerEid] = 1;
    addComponent(world, InputStateComponent, playerEid);
    InputStateComponent.attack[playerEid] = 1; // Pressing Space

    const recruitmentSystem = createRecruitmentSystem();
    recruitmentSystem(world, 16);

    // Verify energy deducted: 50 - 10 = 40
    expect(CampCoreComponent.lightEnergy[coreEid]).toBe(40);

    // Verify peasant upgraded to Builder with 75 HP
    expect(UnitRole.role[peasantEid]).toBe(RoleValues.BUILDER);
    expect(Health.max[peasantEid]).toBe(75);
    expect(Health.current[peasantEid]).toBe(75);
    expect(Speed.value[peasantEid]).toBe(60);
  });

  it('should upgrade unemployed peasant to Archer (80 HP, Ranged, Attack 15) when player presses Space at Bow Stand', () => {
    const world = createWorld();

    // Camp Core with 50 energy
    const coreEid = addEntity(world);
    addComponent(world, CampCoreComponent, coreEid);
    CampCoreComponent.lightEnergy[coreEid] = 50;
    addComponent(world, Position, coreEid);
    Position.x[coreEid] = 1600;
    Position.y[coreEid] = 650;

    // Bow Stand at x=1450
    const poiEid = addEntity(world);
    addComponent(world, Position, poiEid);
    Position.x[poiEid] = 1450;
    Position.y[poiEid] = 650;
    addComponent(world, WildernessPoiComponent, poiEid);
    WildernessPoiComponent.poiType[poiEid] = 5; // Bow Stand

    // Unemployed peasant
    const peasantEid = addEntity(world);
    addComponent(world, Position, peasantEid);
    Position.x[peasantEid] = 1500;
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

    // Player standing at Bow Stand pressing Space
    const playerEid = addEntity(world);
    addComponent(world, Position, playerEid);
    Position.x[playerEid] = 1450;
    Position.y[playerEid] = 650;
    addComponent(world, PlayerControlled, playerEid);
    PlayerControlled.playerId[playerEid] = 1;
    addComponent(world, InputStateComponent, playerEid);
    InputStateComponent.attack[playerEid] = 1; // Pressing Space

    const recruitmentSystem = createRecruitmentSystem();
    recruitmentSystem(world, 16);

    // Verify energy deducted: 50 - 15 = 35
    expect(CampCoreComponent.lightEnergy[coreEid]).toBe(35);

    // Verify peasant upgraded to Archer with 80 HP and Ranged combat
    expect(UnitRole.role[peasantEid]).toBe(RoleValues.ARCHER);
    expect(Health.max[peasantEid]).toBe(80);
    expect(Health.current[peasantEid]).toBe(80);
    expect(CombatTypeComponent.type[peasantEid]).toBe(CombatTypeValues.Ranged);
    expect(Attack.power[peasantEid]).toBe(15);
  });
});

describe('Progression XP System', () => {
  it('should compute xp gain and single level up correctly', () => {
    const result = computeXpGain(40, 20, 50);
    expect(result.didLevelUp).toBe(true);
    expect(result.newLevel).toBe(1);
    expect(result.remainingXp).toBe(10);
  });

  it('should compute xp gain without level up correctly', () => {
    const result = computeXpGain(10, 20, 50);
    expect(result.didLevelUp).toBe(false);
    expect(result.newLevel).toBe(0);
    expect(result.remainingXp).toBe(30);
  });

  it('should handle multiple level ups in one gain', () => {
    // Current XP = 0, gained = 150.
    // Level 1 -> 2: 50 XP
    // Level 2 -> 3: 75 XP (50 * 1.5)
    // Level 3 -> 4: 112 XP (75 * 1.5)
    // Total used for 2 levels: 50 + 75 = 125.
    // Remaining XP: 150 - 125 = 25.
    const result = computeXpGain(0, 150, 50);
    expect(result.didLevelUp).toBe(true);
    expect(result.newLevel).toBe(2);
    expect(result.remainingXp).toBe(25);
  });
});
