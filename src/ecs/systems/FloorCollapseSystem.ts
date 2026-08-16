import { defineQuery, IWorld, removeEntity } from "bitecs";
import { FloorComponent, FloorCrystalComponent, Health, InvasionSpawner, DestructionEvent, Position, SpireComponent } from "../components";
import { addEntity, addComponent } from "bitecs";

const floorQuery = defineQuery([FloorComponent, FloorCrystalComponent, Health, Position]);
const spawnerQuery = defineQuery([InvasionSpawner]);

// ─────────────────────────────────────────────────────
// EXPORTED PURE LOGIC
// ─────────────────────────────────────────────────────
export function computeFloorCollapse(remainingFloors: number, _destroyedFloorIndex: number): { newFloorCount: number, spawnRateMultiplier: number } {
  const newFloorCount = Math.max(0, remainingFloors - 1);
  const spawnRateMultiplier = newFloorCount === 0 ? 1 : 1 + ((5 - newFloorCount) / 5) * 2; // Throttle up to 3x based on missing floors, assuming max 5 for scale. Or simply use something > 1
  return { newFloorCount, spawnRateMultiplier };
}

// ─────────────────────────────────────────────────────
// SYSTEM FACTORY
// ─────────────────────────────────────────────────────
export function createFloorCollapseSystem() {
  return (world: IWorld, _delta: number): IWorld => {
    const floors = floorQuery(world);
    const spawners = spawnerQuery(world);

    // Pass 1: Collapse floors that hit 0 crystal HP
    for (let i = 0; i < floors.length; i++) {
        const floorEid = floors[i];

        if (FloorCrystalComponent.isDestroyed[floorEid] === 0 && Health.current[floorEid] <= 0) {
            FloorCrystalComponent.isDestroyed[floorEid] = 1;
            FloorComponent.active[floorEid] = 0;
            FloorComponent.cleared[floorEid] = 1;

            const spireEid = FloorCrystalComponent.spireEid[floorEid];
            const currentFloors = SpireComponent.floorCount[spireEid];

            const collapseResult = computeFloorCollapse(currentFloors, FloorCrystalComponent.floorIndex[floorEid]);

            SpireComponent.floorCount[spireEid] = collapseResult.newFloorCount;

            // Trigger DestructionEvent
            const eventEid = addEntity(world);
            addComponent(world, DestructionEvent, eventEid);
            DestructionEvent.x[eventEid] = Position.x[floorEid] !== undefined ? Position.x[floorEid] : 0;
            DestructionEvent.y[eventEid] = Position.y[floorEid] !== undefined ? Position.y[floorEid] : 0;
            DestructionEvent.type[eventEid] = 0; // 0 = Floor Collapse

            // Throttle spawn rate
            const spireSide = FloorComponent.spireSide[floorEid];
            for (let j = 0; j < spawners.length; j++) {
                const spawnerEid = spawners[j];
                if (InvasionSpawner.spireSide[spawnerEid] === spireSide) {
                    const baseCooldown = InvasionSpawner.baseCooldown[spawnerEid];
                    // Using our computeFloorCollapse spawnRateMultiplier logic
                    InvasionSpawner.spawnCooldown[spawnerEid] = baseCooldown * collapseResult.spawnRateMultiplier;
                }
            }

            // Important logic fix: The explicit requirement states "That floor is deleted from the ECS and spriteMap".
            // Triggering the DestructionEvent takes care of the visual effect. But we must actually remove the entity here so RenderSyncSystem deletes it properly
            // We use removeEntity provided by bitECS. Since we are inside a query loop over floors, we should be careful not to corrupt iteration, but bitECS handles removeEntity safely by delaying actual removal until the end of the query or frame.
            // However, to be extra safe, since we already did `isDestroyed = 1` and `active = 0`, we can remove it.
        }
    }

    // Pass 2: Clean up destroyed floors
    for (let i = 0; i < floors.length; i++) {
      const floorEid = floors[i];
      if (FloorCrystalComponent.isDestroyed[floorEid] === 1) {
          // It's destroyed, let's defer removal so the RenderSync can play the particle effect maybe?
          // Actually, we should just delete it here and RenderSync can handle the explosion via the DestructionEvent entity instead.
          // Let's remove it directly.
          removeEntity(world, floorEid);
      }
    }

    return world;
  };
}