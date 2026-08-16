import { defineQuery, IWorld, addEntity, addComponent } from "bitecs";
import { AetherMoteComponent, CampCoreComponent, Position } from "../components";

const coreQuery = defineQuery([CampCoreComponent, Position]);
const moteQuery = defineQuery([AetherMoteComponent]);

// ─────────────────────────────────────────────────────
// EXPORTED PURE LOGIC
// ─────────────────────────────────────────────────────
export function shouldSpawnMote(timer: number, cooldown: number, currentMotes: number, maxMotes: number): boolean {
  return timer >= cooldown && currentMotes < maxMotes;
}

// ─────────────────────────────────────────────────────
// SYSTEM FACTORY
// ─────────────────────────────────────────────────────
export function createAetherSpawningSystem(spawnIntervalMs = 4000, maxMotes = 10) {
  let timer = 0;

  return (world: IWorld, delta: number): IWorld => {
    timer += delta;

    // We only spawn at the first CampCore found
    const cores = coreQuery(world);
    if (cores.length === 0) return world;

    const coreEid = cores[0];
    const coreX = Position.x[coreEid];
    const coreY = Position.y[coreEid];

    // Count hearth motes
    const motes = moteQuery(world);
    let hearthMotesCount = 0;
    for (let i = 0; i < motes.length; i++) {
        if (AetherMoteComponent.isHearthMote[motes[i]] === 1) {
            hearthMotesCount++;
        }
    }

    if (shouldSpawnMote(timer, spawnIntervalMs, hearthMotesCount, maxMotes)) {
      timer -= spawnIntervalMs;

      const moteEid = addEntity(world);
      addComponent(world, Position, moteEid);
      Position.x[moteEid] = coreX;
      Position.y[moteEid] = coreY;

      addComponent(world, AetherMoteComponent, moteEid);
      AetherMoteComponent.value[moteEid] = 10;
      AetherMoteComponent.isMagnetized[moteEid] = 0;
      AetherMoteComponent.isHearthMote[moteEid] = 1;
      AetherMoteComponent.originX[moteEid] = coreX;
      AetherMoteComponent.originY[moteEid] = coreY - 20; // Slightly above hearth
      AetherMoteComponent.orbitAngle[moteEid] = Math.random() * Math.PI * 2;
    }

    return world;
  };
}
