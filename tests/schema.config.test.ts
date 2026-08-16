import { describe, it, expect } from "vitest";
import { CampConfigSchema, SpireConfigSchema } from "../src/data/schemas";

describe("CampConfigSchema validation", () => {
  it("should accept valid camp config data", () => {
    const validData = {
      startingLightEnergy: 10,
      energyRate: 5,
      maxLightEnergy: 100,
      leftWallHP: 1000,
      rightWallHP: 1000,
    };
    const result = CampConfigSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject negative starting energy", () => {
    const invalidData = {
      startingLightEnergy: -10,
      energyRate: 5,
      maxLightEnergy: 100,
      leftWallHP: 1000,
      rightWallHP: 1000,
    };
    const result = CampConfigSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe("SpireConfigSchema validation", () => {
  it("should accept valid spire config data", () => {
    const validData = {
      startingDarkEnergy: 0,
      darkEnergyRate: 2,
      floorGrowthCost: 50,
      maxFloors: 10,
      crystalMaxHP: 500,
      initialFloors: 1,
    };
    const result = SpireConfigSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject missing fields", () => {
    const invalidData = {
      startingDarkEnergy: 0,
      darkEnergyRate: 2,
    };
    const result = SpireConfigSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
