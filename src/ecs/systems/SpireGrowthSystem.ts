import { defineQuery, IWorld } from "bitecs";
import { SpireComponent, Position, Health } from "../components";
import { createFloorEntity } from "../world";

const spireQuery = defineQuery([SpireComponent, Position, Health]);

// ─────────────────────────────────────────────────────
// EXPORTED PURE LOGIC — testable by Vitest
// ─────────────────────────────────────────────────────
export function canSpireGrow(
  darkEnergy: number,
  growthCost: number,
  currentFloors: number,
  maxFloors: number
): boolean {
  if (currentFloors >= maxFloors) return false;
  return darkEnergy >= growthCost;
}

export function computeDarkEnergy(current: number, ratePerSec: number, deltaMs: number): number {
  return current + ratePerSec * (deltaMs / 1000);
}

// ─────────────────────────────────────────────────────
// SYSTEM FACTORY
// ─────────────────────────────────────────────────────
export function createSpireGrowthSystem() {
  return (world: IWorld, delta: number): IWorld => {
    const entities = spireQuery(world);

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      if (Health.current[eid] <= 0) {
        SpireComponent.isAlive[eid] = 0;
        continue;
      }

      const rate = SpireComponent.darkEnergyRate[eid];
      let darkEnergy = SpireComponent.darkEnergy[eid];

      darkEnergy = computeDarkEnergy(darkEnergy, rate, delta);
      SpireComponent.darkEnergy[eid] = darkEnergy;

      const growthCost = SpireComponent.growthCost[eid];
      const currentFloors = SpireComponent.floorCount[eid];
      const maxFloors = SpireComponent.maxFloors[eid];

      if (canSpireGrow(darkEnergy, growthCost, currentFloors, maxFloors)) {
        // Grow!
        SpireComponent.darkEnergy[eid] -= growthCost;
        SpireComponent.floorCount[eid] += 1;

        const side = SpireComponent.side[eid];
        const newFloorIndex = currentFloors + 1;
        const x = Position.x[eid];
        const y = Position.y[eid] - (newFloorIndex - 1) * 120;

        createFloorEntity(world, side, newFloorIndex, 100, x, y); // Barricade HP is arbitrary 100 for now. Could also come from config.
      }
    }

    return world;
  };
}
