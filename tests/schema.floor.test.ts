import { describe, it, expect } from "vitest";
import { FloorDataSchema } from "../src/data/schemas";

describe("FloorDataSchema validation", () => {
  const validFloor = {
    floorId: 1,
    monsterBudget: 4,
    barricadeHP: 80,
    hasAlcoveNest: false,
  };

  it("should accept valid floor data", () => {
    const result = FloorDataSchema.safeParse(validFloor);
    expect(result.success).toBe(true);
  });

  it("should accept a floor with alcove nest", () => {
    const result = FloorDataSchema.safeParse({ ...validFloor, floorId: 3, hasAlcoveNest: true });
    expect(result.success).toBe(true);
  });

  it("should reject floorId of 0 (floors are 1-indexed)", () => {
    const result = FloorDataSchema.safeParse({ ...validFloor, floorId: 0 });
    expect(result.success).toBe(false);
  });

  it("should reject negative monsterBudget", () => {
    const result = FloorDataSchema.safeParse({ ...validFloor, monsterBudget: -1 });
    expect(result.success).toBe(false);
  });

  it("should reject missing barricadeHP", () => {
    const { barricadeHP: _omit, ...incomplete } = validFloor;
    const result = FloorDataSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it("should reject non-boolean hasAlcoveNest", () => {
    const result = FloorDataSchema.safeParse({ ...validFloor, hasAlcoveNest: "yes" });
    expect(result.success).toBe(false);
  });
});
