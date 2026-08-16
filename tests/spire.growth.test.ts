import { describe, it, expect } from "vitest";
import { canSpireGrow, computeDarkEnergy } from "../src/ecs/systems/SpireGrowthSystem";

describe("SpireGrowthSystem — pure functions", () => {
  it("computeDarkEnergy should scale with rate and delta", () => {
    const result = computeDarkEnergy(10, 2, 1000); // 10 current, 2/sec, 1000ms
    expect(result).toBeCloseTo(12);

    const result2 = computeDarkEnergy(10, 2, 500); // 10 current, 2/sec, 500ms
    expect(result2).toBeCloseTo(11);
  });

  it("canSpireGrow should return true when energy meets cost and cap is not reached", () => {
    // energy: 50, cost: 50, floors: 1, max: 10
    expect(canSpireGrow(50, 50, 1, 10)).toBe(true);
    expect(canSpireGrow(51, 50, 1, 10)).toBe(true);
  });

  it("canSpireGrow should return false when energy is below cost", () => {
    expect(canSpireGrow(49, 50, 1, 10)).toBe(false);
  });

  it("canSpireGrow should return false when max floors is reached", () => {
    expect(canSpireGrow(100, 50, 10, 10)).toBe(false);
  });
});
