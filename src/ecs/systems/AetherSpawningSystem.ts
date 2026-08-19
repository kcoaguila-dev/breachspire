import { defineQuery, IWorld, addEntity, addComponent } from "bitecs";
import { CampCoreComponent, Position, AetherMoteComponent, DayNightCycle } from "../components";

const coreQuery = defineQuery([CampCoreComponent, Position]);
const dayNightQuery = defineQuery([DayNightCycle]);
const moteQuery = defineQuery([AetherMoteComponent]);

// ─────────────────────────────────────────────────────
// EXPORTED PURE LOGIC — testable by Vitest
// ─────────────────────────────────────────────────────
export function shouldSpawnAetherMote(timer: number, spawnInterval: number, currentMotes: number, maxMotes: number): boolean {
  return timer >= spawnInterval && currentMotes < maxMotes;
}

// ─────────────────────────────────────────────────────
// SYSTEM FACTORY
// ─────────────────────────────────────────────────────
export function createAetherSpawningSystem() {
  let timer = 0;

  return (world: IWorld, delta: number): IWorld => {
    const timeEids = dayNightQuery(world);
    const isNight = timeEids.length > 0 ? DayNightCycle.isNight[timeEids[0]] === 1 : false;

    // Only spawn during Day
    if (isNight) return world;

    timer += delta;

    if (timer >= 4000) {
      const currentMotes = moteQuery(world).length;
      if (!shouldSpawnAetherMote(timer, 4000, currentMotes, 10)) {
        // Can't spawn due to cap, but we cap timer at interval
        timer = 4000;
        return world;
      }

      timer = 0;

      const cores = coreQuery(world);
      if (cores.length === 0) return world;

      const coreEid = cores[0];
      const coreX = Position.x[coreEid];
      const coreY = Position.y[coreEid];

      // Spawn mote near core
      const moteEid = addEntity(world);
      addComponent(world, Position, moteEid);
      addComponent(world, AetherMoteComponent, moteEid);
      AetherMoteComponent.value[moteEid] = 5;
      AetherMoteComponent.lifetime[moteEid] = 18000;
      AetherMoteComponent.maxLifetime[moteEid] = 18000;

      // Random offset around hearth
      Position.x[moteEid] = coreX + (Math.random() * 60 - 30);
      Position.y[moteEid] = coreY - 40 - (Math.random() * 30);
    }

    return world;
  };
}
