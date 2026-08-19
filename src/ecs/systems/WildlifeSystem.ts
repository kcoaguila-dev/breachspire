import { defineQuery, IWorld, addEntity, addComponent, removeEntity } from "bitecs";
import {
  Position,
  Velocity,
  Speed,
  Health,
  FactionTag,
  FactionValues,
  UnitRole,
  RoleValues,
  DayNightCycle,
  AetherMoteComponent
} from "../components";

// ─────────────────────────────────────────────────────
// EXPORTED PURE LOGIC — testable by Vitest
// ─────────────────────────────────────────────────────

export function canSpawnWildlife(currentCount: number, maxCount: number, isNight: boolean): boolean {
  if (isNight) return false;
  return currentCount < maxCount;
}

export function computeWildlifeHopVelocity(randomSeed: number = Math.random()): number {
  // Random small hopping speed between -25px/s and +25px/s
  return (randomSeed * 50) - 25;
}

export function computeMoteDropCount(randomSeed: number = Math.random()): number {
  return randomSeed > 0.4 ? 2 : 1;
}

// ─────────────────────────────────────────────────────
// SYSTEM FACTORY
// ─────────────────────────────────────────────────────

const wildlifeQuery = defineQuery([UnitRole, Position, Velocity, Health, FactionTag]);
const dayNightQuery = defineQuery([DayNightCycle]);

export function createWildlifeSystem() {
  let spawnTimer = 0;
  let hopTimer = 0;

  return (world: IWorld, delta: number): IWorld => {
    const timeEids = dayNightQuery(world);
    const isNight = timeEids.length > 0 ? DayNightCycle.isNight[timeEids[0]] === 1 : false;

    const allUnits = wildlifeQuery(world);
    const slimes: number[] = [];

    for (let i = 0; i < allUnits.length; i++) {
      const eid = allUnits[i];
      if (UnitRole.role[eid] === RoleValues.WILDLIFE) {
        slimes.push(eid);
      }
    }

    // 1. Spawning Slimes in Wilderness during daytime
    spawnTimer += delta;
    if (spawnTimer >= 3500) {
      spawnTimer = 0;

      if (canSpawnWildlife(slimes.length, 12, isNight)) {
        // Spawn slime in wilderness grass zone (e.g. x = 2000..13500 or 18500..30000)
        const isWest = Math.random() < 0.5;
        const x = isWest
          ? 2000 + Math.floor(Math.random() * 11500)
          : 18500 + Math.floor(Math.random() * 11500);

        const slimeEid = addEntity(world);
        addComponent(world, Position, slimeEid);
        Position.x[slimeEid] = x;
        Position.y[slimeEid] = 650;

        addComponent(world, Velocity, slimeEid);
        Velocity.x[slimeEid] = computeWildlifeHopVelocity();
        Velocity.y[slimeEid] = 0;

        addComponent(world, Speed, slimeEid);
        Speed.value[slimeEid] = 25;

        addComponent(world, Health, slimeEid);
        Health.max[slimeEid] = 15;
        Health.current[slimeEid] = 15;

        addComponent(world, FactionTag, slimeEid);
        FactionTag.faction[slimeEid] = FactionValues.Neutral;

        addComponent(world, UnitRole, slimeEid);
        UnitRole.role[slimeEid] = RoleValues.WILDLIFE;
        UnitRole.level[slimeEid] = 1;
      }
    }

    // 2. Passive Hopping AI
    hopTimer += delta;
    if (hopTimer >= 2000) {
      hopTimer = 0;
      for (let i = 0; i < slimes.length; i++) {
        const sEid = slimes[i];
        if (Health.current[sEid] > 0) {
          Velocity.x[sEid] = computeWildlifeHopVelocity();
        }
      }
    }

    // 3. Slime Death & Energy Drop Handling
    for (let i = 0; i < slimes.length; i++) {
      const sEid = slimes[i];
      if (Health.current[sEid] <= 0) {
        const sx = Position.x[sEid];
        const sy = Position.y[sEid];

        // Drop 1-2 Aether Motes
        const drops = computeMoteDropCount();
        for (let d = 0; d < drops; d++) {
          const moteEid = addEntity(world);
          addComponent(world, Position, moteEid);
          Position.x[moteEid] = sx + (Math.random() * 30 - 15);
          Position.y[moteEid] = sy - 10;

          addComponent(world, AetherMoteComponent, moteEid);
          AetherMoteComponent.value[moteEid] = 5;
          AetherMoteComponent.lifetime[moteEid] = 18000; // 18 seconds
          AetherMoteComponent.maxLifetime[moteEid] = 18000;
        }

        // Clean up defeated slime
        removeEntity(world, sEid);
      }
    }

    return world;
  };
}
