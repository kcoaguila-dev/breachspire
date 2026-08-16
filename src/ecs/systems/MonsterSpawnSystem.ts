import { defineQuery, IWorld } from "bitecs";
import { InvasionSpawner, SpireComponent, Position, DayNightCycle } from "../components";
import { createUnitEntity } from "../world";
import { computeWaveComposition } from "./DayNightSystem";
import { UnitStats } from "../../data/schemas";

const spawnerQuery = defineQuery([InvasionSpawner, SpireComponent, Position]);
const dayNightQuery = defineQuery([DayNightCycle]);

// ─────────────────────────────────────────────────────
// EXPORTED PURE LOGIC — testable by Vitest
// ─────────────────────────────────────────────────────
export function computeSpawnRate(baseCooldownMs: number, clearedFloors: number, totalFloors: number): number {
  if (totalFloors === 0) return baseCooldownMs;
  // Each cleared floor adds 50% more cooldown time, for example
  // Throttle multiplier starts at 1, goes up as cleared floors increase
  const throttleMultiplier = 1 + (clearedFloors / totalFloors) * 2; // Arbitrary throttle logic: up to 3x slower
  return baseCooldownMs * throttleMultiplier;
}

export function shouldSpawnWave(timer: number, cooldown: number): boolean {
  return timer >= cooldown;
}

// ─────────────────────────────────────────────────────
// SYSTEM FACTORY
// ─────────────────────────────────────────────────────
export function createMonsterSpawnSystem(monsterData: UnitStats, archerData?: UnitStats, trollData?: UnitStats) {
  return (world: IWorld, delta: number): IWorld => {
    const timeEids = dayNightQuery(world);
    const isNight = timeEids.length > 0 ? DayNightCycle.isNight[timeEids[0]] === 1 : true;
    const dayNumber = timeEids.length > 0 ? DayNightCycle.dayNumber[timeEids[0]] : 1;

    // Only spawn during night
    if (!isNight) return world;
    const spawners = spawnerQuery(world);

    for (let i = 0; i < spawners.length; i++) {
      const eid = spawners[i];

      // Dead entity guard logic (SpireComponent isAlive can be used if Spire health hits 0)
      if (SpireComponent.isAlive[eid] === 0) continue;

      let timer = InvasionSpawner.timer[eid];
      timer += delta;

      const cooldown = InvasionSpawner.spawnCooldown[eid];

      if (shouldSpawnWave(timer, cooldown)) {
        timer = 0;
        const spireFloors = SpireComponent.floorCount[eid];
        const composition = computeWaveComposition(dayNumber, spireFloors);

        const baseX = Position.x[eid];
        const baseY = Position.y[eid];

        let spawnOffset = 0;
        const dir = SpireComponent.side[eid] === 0 ? 1 : -1;

        // Goblins
        for (let j = 0; j < composition.goblinCount; j++) {
           const spawnX = baseX + (spawnOffset * 10) * dir;
           createUnitEntity(world, monsterData, spawnX, baseY);
           spawnOffset++;
        }

        // Archers
        if (archerData) {
            for (let j = 0; j < composition.archerCount; j++) {
               const spawnX = baseX + (spawnOffset * 10) * dir;
               createUnitEntity(world, archerData, spawnX, baseY);
               spawnOffset++;
            }
        }

        // Trolls
        if (trollData) {
            for (let j = 0; j < composition.trollCount; j++) {
               const spawnX = baseX + (spawnOffset * 10) * dir;
               createUnitEntity(world, trollData, spawnX, baseY);
               spawnOffset++;
            }
        }
      }

      InvasionSpawner.timer[eid] = timer;
    }

    return world;
  };
}
