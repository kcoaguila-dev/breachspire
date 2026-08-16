import { defineQuery, IWorld } from "bitecs";
import { CampCoreComponent } from "../components";

const campQuery = defineQuery([CampCoreComponent]);

// ─────────────────────────────────────────────────────
// EXPORTED PURE LOGIC — testable by Vitest without Phaser or world
// ─────────────────────────────────────────────────────
export function computeEnergyGain(
  currentEnergy: number,
  _ratePerSec: number,
  _maxEnergy: number,
  _deltaMs: number
): number {
  // Passive energy gain is disabled per requirements (Aether motes replace it)
  return currentEnergy;
}

// ─────────────────────────────────────────────────────
// SYSTEM FACTORY
// ─────────────────────────────────────────────────────
export function createCampEnergySystem() {
  return (world: IWorld, delta: number): IWorld => {
    const entities = campQuery(world);

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];

      const currentEnergy = CampCoreComponent.lightEnergy[eid];
      const rate = CampCoreComponent.energyRate[eid];
      const maxEnergy = CampCoreComponent.maxEnergy[eid];

      CampCoreComponent.lightEnergy[eid] = computeEnergyGain(
        currentEnergy,
        rate,
        maxEnergy,
        delta
      );
    }

    return world;
  };
}
