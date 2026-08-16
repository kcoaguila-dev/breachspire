import { describe, it, expect } from 'vitest';
import { createWorld } from 'bitecs';
import { Position } from '../src/ecs/components';
import {
  createCampCoreEntity,
  createCampWallEntity,
  createSpireEntity
} from '../src/ecs/world';
import { SpireSideValues } from '../src/ecs/components';
import { CampConfig, SpireConfig } from '../src/data/schemas';

describe('Expansive World Bounds', () => {
  it('should construct the map with expected expansive coordinates', () => {
    const world = createWorld();

    const campConfig: CampConfig = {
      startingLightEnergy: 100,
      energyRate: 5,
      maxLightEnergy: 1000,
      leftWallHP: 500,
      rightWallHP: 500
    };

    const spireConfig: SpireConfig = {
      startingDarkEnergy: 0,
      darkEnergyRate: 10,
      floorGrowthCost: 100,
      initialFloors: 3,
      maxFloors: 10,
      crystalMaxHP: 2000
    };

    // Construct according to new layout specs
    const coreEid = createCampCoreEntity(world, campConfig, 1600, 600);
    const leftWallEid = createCampWallEntity(world, campConfig, SpireSideValues.Left, 1200, 600);
    const rightWallEid = createCampWallEntity(world, campConfig, SpireSideValues.Right, 2000, 600);
    const leftSpireEid = createSpireEntity(world, spireConfig, SpireSideValues.Left, 200, 600);
    const rightSpireEid = createSpireEntity(world, spireConfig, SpireSideValues.Right, 3000, 600);

    expect(Position.x[coreEid]).toBe(1600);
    expect(Position.x[leftWallEid]).toBe(1200);
    expect(Position.x[rightWallEid]).toBe(2000);
    expect(Position.x[leftSpireEid]).toBe(200);
    expect(Position.x[rightSpireEid]).toBe(3000);

    // Bounds verify left/right boundaries
    // Left Spire at 200 is >= 0
    // Right Spire at 3000 is <= 3200
    expect(Position.x[leftSpireEid]).toBeGreaterThanOrEqual(0);
    expect(Position.x[rightSpireEid]).toBeLessThanOrEqual(3200);
  });
});
