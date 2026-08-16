import { defineQuery, IWorld } from "bitecs";
import { SpireFloorStay, FSMState, FSMStateValues, Position, SpireComponent, FloorComponent, Health } from "../components";

const towerUnitQuery = defineQuery([SpireFloorStay, FSMState, Position, Health]);
const spireQuery = defineQuery([SpireComponent, Position]);
const floorQuery = defineQuery([FloorComponent]);

// ─────────────────────────────────────────────────────
// EXPORTED PURE LOGIC
// ─────────────────────────────────────────────────────

export function updateFloorStayTimer(currentTimer: number, delta: number): { remaining: number, isExpired: boolean, progressRatio: number } {
  const remaining = Math.max(0, currentTimer - delta / 1000);
  return {
    remaining,
    isExpired: remaining <= 0,
    progressRatio: remaining // this will be divided by maxDuration outside
  };
}

export function shouldAscendFloor(isRoomCleared: boolean, isTimerExpired: boolean, isAtSummit: boolean): boolean {
  if (isAtSummit) return false;
  return isRoomCleared || isTimerExpired;
}

export function getUnitAttackRate(_unitCombatType: number, isHeavy: boolean): number {
  return isHeavy ? 1500 : 600;
}

// ─────────────────────────────────────────────────────
// SYSTEM FACTORY
// ─────────────────────────────────────────────────────
export function createSpireTowerCombatSystem() {
  return (world: IWorld, delta: number) => {
    const units = towerUnitQuery(world);
    const spires = spireQuery(world);
    const floors = floorQuery(world);

    for (let i = 0; i < units.length; i++) {
      const unitEid = units[i];
      if (Health.current[unitEid] <= 0) continue;

      let currentFloor = SpireFloorStay.currentFloorIndex[unitEid];
      const isAtSummit = SpireFloorStay.isAtSummit[unitEid] === 1;

      // Find nearest Spire
      let nearestSpire = -1;
      let minDistance = Infinity;
      for (let j = 0; j < spires.length; j++) {
        const spireEid = spires[j];
        const dist = Math.abs(Position.x[spireEid] - Position.x[unitEid]);
        if (dist < minDistance) {
          minDistance = dist;
          nearestSpire = spireEid;
        }
      }

      if (nearestSpire === -1) continue;

      // Distance check to see if unit is inside tower influence
      if (minDistance < 200) {
        if (currentFloor === 0) {
          currentFloor = 1;
          SpireFloorStay.currentFloorIndex[unitEid] = 1;
        }

        if (!isAtSummit) {
          // Decrement timer
          const currentTimer = SpireFloorStay.currentTimer[unitEid];
          const timerUpdate = updateFloorStayTimer(currentTimer, delta);
          SpireFloorStay.currentTimer[unitEid] = timerUpdate.remaining;

          // Check if current room is cleared
          let isRoomCleared = false;
          const spireSide = SpireComponent.side[nearestSpire];

          for (let k = 0; k < floors.length; k++) {
            const floorEid = floors[k];
            if (FloorComponent.spireSide[floorEid] === spireSide && FloorComponent.floorIndex[floorEid] === currentFloor) {
              if (FloorComponent.cleared[floorEid] === 1) {
                isRoomCleared = true;
              }
              break;
            }
          }

          if (shouldAscendFloor(isRoomCleared, timerUpdate.isExpired, isAtSummit)) {
            const maxFloors = SpireComponent.floorCount[nearestSpire];
            if (currentFloor < maxFloors) {
              // Ascend
              SpireFloorStay.currentFloorIndex[unitEid] += 1;
              SpireFloorStay.currentTimer[unitEid] = SpireFloorStay.maxDuration[unitEid];
              Position.y[unitEid] -= 50; // visually jump up
              FSMState.state[unitEid] = FSMStateValues.IDLE; // re-evaluate targets
            } else {
              // Lock into SUMMIT_SIEGE
              SpireFloorStay.currentFloorIndex[unitEid] = maxFloors;
              SpireFloorStay.isAtSummit[unitEid] = 1;
              FSMState.state[unitEid] = FSMStateValues.SUMMIT_SIEGE;
              FSMState.targetEntity[unitEid] = nearestSpire;
            }
          }
        }
      }
    }

    return world;
  };
}
