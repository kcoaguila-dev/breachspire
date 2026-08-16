import { describe, it, expect } from "vitest";
import { computeEnergyGain } from "../src/ecs/systems/CampEnergySystem";

describe("CampEnergySystem — computeEnergyGain()", () => {
  it('should not increase energy (passive gain disabled)', () => {
    // Passive gain disabled per requirements
    const result = computeEnergyGain(10, 5, 100, 1000);
    expect(result).toBeCloseTo(10);
  });
});
