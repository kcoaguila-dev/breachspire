import { describe, it, expect } from "vitest";
import { computeEnergyGain } from "../src/ecs/systems/CampEnergySystem";

describe("CampEnergySystem — computeEnergyGain()", () => {
  it("should increase energy based on rate and delta", () => {
    // 5 per sec, 1000ms delta => gain 5
    const result = computeEnergyGain(10, 5, 100, 1000);
    expect(result).toBeCloseTo(15);
  });

  it("should scale with delta correctly", () => {
    // 5 per sec, 500ms delta => gain 2.5
    const result = computeEnergyGain(10, 5, 100, 500);
    expect(result).toBeCloseTo(12.5);
  });

  it("should cap at maxEnergy", () => {
    // 5 per sec, 1000ms delta => gain 5, but max is 12, current is 10. Should cap at 12.
    const result = computeEnergyGain(10, 5, 12, 1000);
    expect(result).toBeCloseTo(12);
  });
});
