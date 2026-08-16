import { defineQuery, IWorld } from "bitecs";
import { CampCoreComponent } from "../components";

const campQuery = defineQuery([CampCoreComponent]);

// ─────────────────────────────────────────────────────
// EXPORTED PURE LOGIC — testable by Vitest without Phaser or world
// ─────────────────────────────────────────────────────
export function computeEnergyGain(
  currentEnergy: number,
  ratePerSec: number,
  maxEnergy: number,
  deltaMs: number
): number {
  const gained = ratePerSec * (deltaMs / 1000);
  return Math.min(currentEnergy + gained, maxEnergy);
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
