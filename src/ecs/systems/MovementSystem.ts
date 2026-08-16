import { defineQuery, IWorld } from "bitecs";
import { Position, Velocity } from "../components";

const movementQuery = defineQuery([Position, Velocity]);

export function createMovementSystem() {
  return (world: IWorld, delta: number) => {
    const entities = movementQuery(world);

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      // Apply velocity to position
      Position.x[eid] += (Velocity.x[eid] * delta) / 1000;
      Position.y[eid] += (Velocity.y[eid] * delta) / 1000;
    }

    return world;
  };
}