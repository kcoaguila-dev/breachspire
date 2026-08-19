import { describe, it, expect, vi } from "vitest";
import { isDead, createDeathSystem } from "../src/ecs/systems/DeathSystem";
import { createWorld, addEntity, addComponent, hasComponent } from "bitecs";
import { Health, Position, FactionTag, FactionValues, UnitRole, RoleValues } from "../src/ecs/components";

describe("DeathSystem — isDead()", () => {
  it("should return true when HP is exactly 0", () => {
    expect(isDead(0)).toBe(true);
  });

  it("should return true when HP is negative (over-damage clamped elsewhere)", () => {
    expect(isDead(-5)).toBe(true);
  });

  it("should return false when HP is above 0", () => {
    expect(isDead(1)).toBe(false);
    expect(isDead(100)).toBe(false);
    expect(isDead(0.1)).toBe(false);
  });

  it("should remove dead role units (Peasant, Builder, Archer, Knight) and destroy their sprites", () => {
    const world = createWorld();
    const spriteMap = new Map();

    const destroySpy = vi.fn();
    const mockSprite = { destroy: destroySpy } as any;

    // Create a builder with 0 HP
    const builderEid = addEntity(world);
    addComponent(world, Health, builderEid);
    Health.current[builderEid] = 0;
    Health.max[builderEid] = 75;

    addComponent(world, Position, builderEid);
    Position.x[builderEid] = 100;
    Position.y[builderEid] = 650;

    addComponent(world, FactionTag, builderEid);
    FactionTag.faction[builderEid] = FactionValues.Hero;

    addComponent(world, UnitRole, builderEid);
    UnitRole.role[builderEid] = RoleValues.BUILDER;

    spriteMap.set(builderEid, mockSprite);

    // Create an archer with positive HP
    const archerEid = addEntity(world);
    addComponent(world, Health, archerEid);
    Health.current[archerEid] = 80;
    Health.max[archerEid] = 80;

    addComponent(world, Position, archerEid);
    Position.x[archerEid] = 200;
    Position.y[archerEid] = 650;

    addComponent(world, FactionTag, archerEid);
    FactionTag.faction[archerEid] = FactionValues.Hero;

    addComponent(world, UnitRole, archerEid);
    UnitRole.role[archerEid] = RoleValues.ARCHER;

    const deathSystem = createDeathSystem(spriteMap);
    deathSystem(world);

    // Verify builder sprite was destroyed and removed
    expect(destroySpy).toHaveBeenCalledTimes(1);
    expect(spriteMap.has(builderEid)).toBe(false);
    expect(hasComponent(world, Health, builderEid)).toBe(false);

    // Verify archer is still alive
    expect(hasComponent(world, Health, archerEid)).toBe(true);
  });
});
