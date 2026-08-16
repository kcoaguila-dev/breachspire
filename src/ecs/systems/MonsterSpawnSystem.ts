import { defineQuery, IWorld } from "bitecs";
import { InvasionSpawner, SpireComponent, Position } from "../components";
import { createUnitEntity } from "../world";
import { UnitStats } from "../../data/schemas";

const spawnerQuery = defineQuery([InvasionSpawner, SpireComponent, Position]);

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
export function createMonsterSpawnSystem(monsterData: UnitStats) {
  return (world: IWorld, delta: number): IWorld => {
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
        const waveSize = InvasionSpawner.waveSize[eid];

        // Spires are spawners. Spawn monsters at the Spire's position (or slightly offset)
        const baseX = Position.x[eid];
        const baseY = Position.y[eid];

        for (let j = 0; j < waveSize; j++) {
           const spawnX = baseX + (j * 10) * (SpireComponent.side[eid] === 0 ? 1 : -1); // Spread out slightly
           createUnitEntity(world, monsterData, spawnX, baseY);
        }
      }

      InvasionSpawner.timer[eid] = timer;
    }

    return world;
  };
}
