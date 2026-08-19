import { describe, it, expect } from 'vitest';
import { computeConstructionProgress, createBuildingSystem } from '../src/ecs/systems/BuildingSystem';
import { createWorld, addEntity, addComponent, hasComponent } from 'bitecs';
import { Position, WallBlueprint, BlueprintStateValues, UnitRole, RoleValues, CampCoreComponent, PlayerControlled, InputStateComponent, Velocity, Speed, CampWallComponent, Health } from '../src/ecs/components';

describe('Building System', () => {
  it('should compute construction progress correctly', () => {
    const progress = computeConstructionProgress(0, 100, 1000);
    expect(progress).toBe(100);
  });

  it('should compute construction progress correctly for half a second', () => {
    const progress = computeConstructionProgress(50, 100, 500);
    expect(progress).toBe(100);
  });

  it('should order wall blueprint (10 Aether) when player presses Space in front of wall mound', () => {
    const world = createWorld();

    // Camp Core with 50 energy
    const coreEid = addEntity(world);
    addComponent(world, CampCoreComponent, coreEid);
    CampCoreComponent.lightEnergy[coreEid] = 50;
    addComponent(world, Position, coreEid);
    Position.x[coreEid] = 1600;
    Position.y[coreEid] = 650;

    // Wall Mound at x=850
    const bpEid = addEntity(world);
    addComponent(world, Position, bpEid);
    Position.x[bpEid] = 850;
    Position.y[bpEid] = 650;
    addComponent(world, WallBlueprint, bpEid);
    WallBlueprint.state[bpEid] = BlueprintStateValues.MOUND;
    WallBlueprint.cost[bpEid] = 10;

    // Player standing at x=850 pressing Space
    const playerEid = addEntity(world);
    addComponent(world, Position, playerEid);
    Position.x[playerEid] = 850;
    Position.y[playerEid] = 650;
    addComponent(world, PlayerControlled, playerEid);
    PlayerControlled.playerId[playerEid] = 1;
    addComponent(world, InputStateComponent, playerEid);
    InputStateComponent.attack[playerEid] = 1; // Pressing Space

    const buildingSystem = createBuildingSystem();
    buildingSystem(world, 16);

    // Verify 10 Aether deducted and blueprint set to ORDERED
    expect(CampCoreComponent.lightEnergy[coreEid]).toBe(40);
    expect(WallBlueprint.state[bpEid]).toBe(BlueprintStateValues.ORDERED);
  });

  it('should have builder walk to ordered blueprint and construct completed stone wall', () => {
    const world = createWorld();

    // Camp Core
    const coreEid = addEntity(world);
    addComponent(world, CampCoreComponent, coreEid);
    CampCoreComponent.lightEnergy[coreEid] = 50;
    addComponent(world, Position, coreEid);
    Position.x[coreEid] = 1600;
    Position.y[coreEid] = 650;

    // Ordered Wall Blueprint at x=850
    const bpEid = addEntity(world);
    addComponent(world, Position, bpEid);
    Position.x[bpEid] = 850;
    Position.y[bpEid] = 650;
    addComponent(world, WallBlueprint, bpEid);
    WallBlueprint.state[bpEid] = BlueprintStateValues.ORDERED;
    WallBlueprint.progress[bpEid] = 95; // 95% complete

    // Builder standing right at the blueprint
    const builderEid = addEntity(world);
    addComponent(world, Position, builderEid);
    Position.x[builderEid] = 850;
    Position.y[builderEid] = 650;
    addComponent(world, Velocity, builderEid);
    addComponent(world, Speed, builderEid);
    Speed.value[builderEid] = 60;
    addComponent(world, UnitRole, builderEid);
    UnitRole.role[builderEid] = RoleValues.BUILDER;
    UnitRole.level[builderEid] = 1;

    const buildingSystem = createBuildingSystem();
    // Run with delta 1000ms -> builder finishes construction
    buildingSystem(world, 1000);

    // Blueprint component is removed and stone wall instantiated with HP
    expect(hasComponent(world, WallBlueprint, bpEid)).toBe(false);
    expect(hasComponent(world, CampWallComponent, bpEid)).toBe(true);
    expect(CampWallComponent.hp[bpEid]).toBe(100);
    expect(Health.current[bpEid]).toBe(100);
  });
});
