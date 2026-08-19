import { describe, it, expect } from 'vitest';
import { computeHarvestProgress, canAffordTag, createHarvestingSystem } from '../src/ecs/systems/HarvestingSystem';
import { createWorld, addEntity, addComponent } from 'bitecs';
import { Position, HarvestableNode, HarvestableStateValues, UnitRole, RoleValues, CampCoreComponent, CampStockComponent, PlayerControlled, InputStateComponent, Velocity, Speed, Health, DayNightCycle } from '../src/ecs/components';

describe('Harvesting System', () => {
  it('should compute harvest progress correctly', () => {
    const progress = computeHarvestProgress(50, 20, 1000);
    expect(progress).toBe(70);
  });

  it('should return true if can afford tag', () => {
    expect(canAffordTag(2)).toBe(true);
    expect(canAffordTag(5)).toBe(true);
    expect(canAffordTag(1)).toBe(false);
  });

  it('should deduct aether and tag node when player presses attack near it', () => {
    const world = createWorld();

    const coreEid = addEntity(world);
    addComponent(world, CampCoreComponent, coreEid);
    CampCoreComponent.lightEnergy[coreEid] = 10;
    addComponent(world, CampStockComponent, coreEid);

    const nodeEid = addEntity(world);
    addComponent(world, Position, nodeEid);
    Position.x[nodeEid] = 100;
    Position.y[nodeEid] = 100;
    addComponent(world, HarvestableNode, nodeEid);
    HarvestableNode.state[nodeEid] = HarvestableStateValues.Natural;

    const playerEid = addEntity(world);
    addComponent(world, Position, playerEid);
    Position.x[playerEid] = 100;
    Position.y[playerEid] = 100;
    addComponent(world, PlayerControlled, playerEid);
    addComponent(world, InputStateComponent, playerEid);
    InputStateComponent.attack[playerEid] = 1;

    const harvestingSystem = createHarvestingSystem();
    harvestingSystem(world, 16);

    expect(CampCoreComponent.lightEnergy[coreEid]).toBe(8);
    expect(HarvestableNode.state[nodeEid]).toBe(HarvestableStateValues.Ordered);
  });

  it('should send a builder to harvest an ordered node and add to stock on completion', () => {
    const world = createWorld();

    const coreEid = addEntity(world);
    addComponent(world, CampCoreComponent, coreEid);
    addComponent(world, CampStockComponent, coreEid);
    CampStockComponent.wood[coreEid] = 0;

    const dnEid = addEntity(world);
    addComponent(world, DayNightCycle, dnEid);
    DayNightCycle.isNight[dnEid] = 0; // Day time

    const nodeEid = addEntity(world);
    addComponent(world, Position, nodeEid);
    Position.x[nodeEid] = 200;
    Position.y[nodeEid] = 100;
    addComponent(world, HarvestableNode, nodeEid);
    HarvestableNode.nodeType[nodeEid] = 0; // Pine tree
    HarvestableNode.state[nodeEid] = HarvestableStateValues.Ordered;
    HarvestableNode.progress[nodeEid] = 90;
    HarvestableNode.yieldCount[nodeEid] = 5;

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

    const harvestingSystem = createHarvestingSystem();
    harvestingSystem(world, 1000); // 1 second delta, 20 progress added

    expect(HarvestableNode.progress[nodeEid]).toBeGreaterThanOrEqual(100);
    expect(HarvestableNode.state[nodeEid]).toBe(HarvestableStateValues.Depleted);
    expect(CampStockComponent.wood[coreEid]).toBe(5);
  });
});
