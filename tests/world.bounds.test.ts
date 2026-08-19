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

    // Construct according to Kingdom Islands 3-5 (32,000px) layout specs
    const coreEid = createCampCoreEntity(world, campConfig, 16000, 600);
    const leftWallEid = createCampWallEntity(world, campConfig, SpireSideValues.Left, 14200, 600);
    const rightWallEid = createCampWallEntity(world, campConfig, SpireSideValues.Right, 17800, 600);
    const leftSpireEid = createSpireEntity(world, spireConfig, SpireSideValues.Left, 800, 600);
    const rightSpireEid = createSpireEntity(world, spireConfig, SpireSideValues.Right, 31200, 600);

    expect(Position.x[coreEid]).toBe(16000);
    expect(Position.x[leftWallEid]).toBe(14200);
    expect(Position.x[rightWallEid]).toBe(17800);
    expect(Position.x[leftSpireEid]).toBe(800);
    expect(Position.x[rightSpireEid]).toBe(31200);

    // Bounds verify left/right boundaries
    // Left Spire at 800 is >= 0
    // Right Spire at 31200 is <= 32000
    expect(Position.x[leftSpireEid]).toBeGreaterThanOrEqual(0);
    expect(Position.x[rightSpireEid]).toBeLessThanOrEqual(32000);
  });
});
