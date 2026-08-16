import { defineQuery, IWorld } from "bitecs";
import { PlayerControlled, Position, Velocity, InputStateComponent, FloorComponent } from "../components";

const playerQuery = defineQuery([PlayerControlled, Position, Velocity, InputStateComponent]);
const floorQuery = defineQuery([FloorComponent, Position]);

export function createClimbingSystem() {
  return (world: IWorld, _delta: number) => {
    const players = playerQuery(world);
    const floors = floorQuery(world);

    for (let i = 0; i < players.length; i++) {
      const pEid = players[i];

      // If pressing UP
      if (InputStateComponent.up[pEid] === 1) {
        const px = Position.x[pEid];
        const py = Position.y[pEid];

        let targetFloorY = -1;
        let closestDist = Infinity;

        // Find the closest active floor that is directly above the player
        for (let j = 0; j < floors.length; j++) {
          const fEid = floors[j];
          if (FloorComponent.active[fEid] === 0) continue;

          const fx = Position.x[fEid];
          const fy = Position.y[fEid];

          // Must be near the ladder horizontally. Let's assume ladder is close to floor center.
          if (Math.abs(fx - px) < 40) {
            // Target floor must be higher than player (smaller Y in Phaser)
            if (fy < py - 10) {
              const dist = py - fy;
              if (dist < closestDist) {
                closestDist = dist;
                targetFloorY = fy;
              }
            }
          }
        }

        if (targetFloorY !== -1 && closestDist < 150) {
           // Allow climbing. Set vertical velocity
           Velocity.y[pEid] = -100;
        }
      }

      // Stop climbing if reached the floor
      if (Velocity.y[pEid] < 0) {
        // Find if we reached any floor
        let snapped = false;
        for (let j = 0; j < floors.length; j++) {
           const fEid = floors[j];
           const fy = Position.y[fEid];
           if (Math.abs(Position.y[pEid] - fy) < 5 && Math.abs(Position.x[pEid] - Position.x[fEid]) < 40) {
             Position.y[pEid] = fy;
             Velocity.y[pEid] = 0;
             snapped = true;
             break;
           }
        }

        // If they keep going up but didn't press up or hit something, we might want to drop them but let's just let velocity run until they hit floor.
        // Wait, what if they stop pressing up?
        if (InputStateComponent.up[pEid] === 0 && !snapped) {
            // Apply gravity or snap down?
            // The prompt says "Heroes climb ladders ([W] / [Up Arrow]) into the chamber".
            // So they must hold up, otherwise gravity pulls them down.
            Velocity.y[pEid] = 100;
        }
      }

      // Apply gravity if they are falling
      if (Velocity.y[pEid] > 0) {
        let snapped = false;
        for (let j = 0; j < floors.length; j++) {
           const fEid = floors[j];
           const fy = Position.y[fEid];
           // Only snap if falling onto it
           if (Position.y[pEid] >= fy - 5 && Position.y[pEid] <= fy + 5 && Math.abs(Position.x[pEid] - Position.x[fEid]) < 60) {
             Position.y[pEid] = fy;
             Velocity.y[pEid] = 0;
             snapped = true;
             break;
           }
        }

        // If grounded (Y >= 650)
        if (!snapped && Position.y[pEid] >= 650) {
           Position.y[pEid] = 650;
           Velocity.y[pEid] = 0;
           snapped = true;
        }

        if (!snapped) {
           Velocity.y[pEid] = 150; // Keep falling
        }
      }

      // If they are on a floor and walk off the edge, they fall
      if (Velocity.y[pEid] === 0 && Position.y[pEid] < 650) {
        let supported = false;
        for (let j = 0; j < floors.length; j++) {
           const fEid = floors[j];
           const fy = Position.y[fEid];
           if (Math.abs(Position.y[pEid] - fy) < 5 && Math.abs(Position.x[pEid] - Position.x[fEid]) < 60) {
             supported = true;
             break;
           }
        }
        if (!supported) {
           Velocity.y[pEid] = 150; // Start falling
        }
      }
    }

    return world;
  };
}
