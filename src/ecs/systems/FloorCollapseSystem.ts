import { defineQuery, IWorld } from "bitecs";
import { FloorComponent, InvasionSpawner } from "../components";
import { computeSpawnRate } from "./MonsterSpawnSystem";

const floorQuery = defineQuery([FloorComponent]);
const spawnerQuery = defineQuery([InvasionSpawner]);

// ─────────────────────────────────────────────────────
// EXPORTED PURE LOGIC
// ─────────────────────────────────────────────────────
export function isFloorClearable(barricadeHp: number): boolean {
  return barricadeHp <= 0;
}

export function calculateThrottleMultiplier(clearedFloors: number, totalFloors: number): number {
  if (totalFloors === 0) return 1;
  // Arbitrary scaling based on cleared floors, e.g. 50% slow down per cleared floor
  return 1 + (clearedFloors / totalFloors) * 2;
}

// ─────────────────────────────────────────────────────
// SYSTEM FACTORY
// ─────────────────────────────────────────────────────
export function createFloorCollapseSystem() {
  return (world: IWorld, _delta: number): IWorld => {
    const floors = floorQuery(world);
    const spawners = spawnerQuery(world);

    // Track cleared vs total floors per spire
    const totalFloorsPerSpire = new Map<number, number>();
    const clearedFloorsPerSpire = new Map<number, number>();

    // Pass 1: Collapse floors that hit 0 barricade HP, count cleared/total
    for (let i = 0; i < floors.length; i++) {
        const floorEid = floors[i];
        const spireSide = FloorComponent.spireSide[floorEid];

        // Ensure map entries exist
        if (!totalFloorsPerSpire.has(spireSide)) {
            totalFloorsPerSpire.set(spireSide, 0);
            clearedFloorsPerSpire.set(spireSide, 0);
        }

        totalFloorsPerSpire.set(spireSide, totalFloorsPerSpire.get(spireSide)! + 1);

        // Check if floor can be cleared
        if (FloorComponent.cleared[floorEid] === 0) {
            if (isFloorClearable(FloorComponent.barricadeHP[floorEid])) {
                FloorComponent.cleared[floorEid] = 1;
                FloorComponent.active[floorEid] = 0;
                // Barricade is destroyed, visual cue (collapse) handled in render system
            }
        }

        if (FloorComponent.cleared[floorEid] === 1) {
            clearedFloorsPerSpire.set(spireSide, clearedFloorsPerSpire.get(spireSide)! + 1);
        }
    }

    // Pass 2: Update InvasionSpawners based on throttled multipliers
    for (let i = 0; i < spawners.length; i++) {
        const spawnerEid = spawners[i];
        const side = InvasionSpawner.spireSide[spawnerEid];

        const total = totalFloorsPerSpire.get(side) || 0;
        const cleared = clearedFloorsPerSpire.get(side) || 0;

        const baseCooldown = InvasionSpawner.baseCooldown[spawnerEid];

        // Let's use computeSpawnRate here to satisfy the requirement. It computes exactly the same logic
        const newCooldown = computeSpawnRate(baseCooldown, cleared, total);

        InvasionSpawner.spawnCooldown[spawnerEid] = newCooldown;
    }

    return world;
  };
}