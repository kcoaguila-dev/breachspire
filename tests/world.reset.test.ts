import { describe, it, expect } from "vitest";
import { createWorld, addEntity, addComponent, getAllEntities, defineQuery } from "bitecs";
import { resetWorldState } from "../src/ecs/world";
import { Position } from "../src/ecs/components";

describe("World State Reset", () => {
  it("should completely empty the world of positioned entities", () => {
    const world = createWorld();

    const eid1 = addEntity(world);
    addComponent(world, Position, eid1);

    const eid2 = addEntity(world);
    addComponent(world, Position, eid2);

    // Check initial state
    const beforeEntities = getAllEntities(world);
    expect(beforeEntities.length).toBeGreaterThanOrEqual(2);

    resetWorldState(world);

    const posQ = defineQuery([Position]);
    expect(posQ(world).length).toBe(0);
  });
});
