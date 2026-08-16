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
  let wasNight = false;

  return (world: IWorld, delta: number): IWorld => {
    const timeEids = dayNightQuery(world);
    const isNight = timeEids.length > 0 ? DayNightCycle.isNight[timeEids[0]] === 1 : true;
    const dayNumber = timeEids.length > 0 ? DayNightCycle.dayNumber[timeEids[0]] : 1;
    const spawners = spawnerQuery(world);

    // If it just turned night, populate pending spawns
    if (isNight && !wasNight) {
      for (let i = 0; i < spawners.length; i++) {
        const eid = spawners[i];
        if (SpireComponent.isAlive[eid] === 0) continue;
        const spireFloors = SpireComponent.floorCount[eid];
        const composition = computeWaveComposition(dayNumber, spireFloors);
        InvasionSpawner.pendingGoblins[eid] += composition.goblinCount;
        InvasionSpawner.pendingArchers[eid] += composition.archerCount;
        InvasionSpawner.pendingTrolls[eid] += composition.trollCount;
        InvasionSpawner.timer[eid] = InvasionSpawner.spawnCooldown[eid]; // Force immediate spawn of first squad
      }
    }
    wasNight = isNight;

    if (!isNight) return world;

    for (let i = 0; i < spawners.length; i++) {
      const eid = spawners[i];
      if (SpireComponent.isAlive[eid] === 0) continue;

      // Space out night spawns into squads (e.g. 2–3 monsters every 5–8 seconds)
      const STAGGERED_COOLDOWN = 6500; // 6.5 seconds

      let timer = InvasionSpawner.timer[eid];
      timer += delta;

      if (timer >= STAGGERED_COOLDOWN) {
        timer = 0;

        const baseX = Position.x[eid];
        const baseY = Position.y[eid];
        const dir = SpireComponent.side[eid] === 0 ? 1 : -1;
        let spawnOffset = 0;

        // Spawn a small squad (max 3 units per tick)
        let spawnedThisTick = 0;

        while (spawnedThisTick < 3) {
          if (InvasionSpawner.pendingTrolls[eid] > 0 && trollData) {
            createUnitEntity(world, trollData, baseX + (spawnOffset * 10) * dir, baseY);
            InvasionSpawner.pendingTrolls[eid]--;
          } else if (InvasionSpawner.pendingArchers[eid] > 0 && archerData) {
            createUnitEntity(world, archerData, baseX + (spawnOffset * 10) * dir, baseY);
            InvasionSpawner.pendingArchers[eid]--;
          } else if (InvasionSpawner.pendingGoblins[eid] > 0) {
            createUnitEntity(world, monsterData, baseX + (spawnOffset * 10) * dir, baseY);
            InvasionSpawner.pendingGoblins[eid]--;
          } else {
            break; // No more pending spawns
          }
          spawnOffset++;
          spawnedThisTick++;
        }
      }

      InvasionSpawner.timer[eid] = timer;
    }

    return world;
  };
}
