import { describe, it, expect } from "vitest";
import { formatEnergyText, calculateBarFill, canPurchaseUpgrade } from "../src/ui/HUDState";

describe("HUDState UI pure functions", () => {
  describe("formatEnergyText", () => {
    it("should format string correctly", () => {
      expect(formatEnergyText(50, 100)).toBe("Energy: 50/100");
    });
    it("should handle floating points by flooring", () => {
      expect(formatEnergyText(50.6, 100.9)).toBe("Energy: 50/100");
    });
    it("should handle negative values by returning 0", () => {
      expect(formatEnergyText(-10, -50)).toBe("Energy: 0/0");
    });
  });

  describe("calculateBarFill", () => {
    it("should return ratio clamped between 0 and 1", () => {
      expect(calculateBarFill(50, 100)).toBe(0.5);
    });
    it("should clamp below 0", () => {
      expect(calculateBarFill(-10, 100)).toBe(0);
    });
    it("should clamp above max", () => {
      expect(calculateBarFill(150, 100)).toBe(1);
    });
    it("should return 0 when max is 0", () => {
      expect(calculateBarFill(50, 0)).toBe(0);
    });
    it("should return 0 when max is negative", () => {
      expect(calculateBarFill(50, -10)).toBe(0);
    });
  });

  describe("canPurchaseUpgrade", () => {
    it("should return true if not unlocked and enough spoils", () => {
      expect(canPurchaseUpgrade(100, 150, false)).toBe(true);
      expect(canPurchaseUpgrade(100, 100, false)).toBe(true);
    });
    it("should return false if not unlocked but insufficient spoils", () => {
      expect(canPurchaseUpgrade(100, 50, false)).toBe(false);
    });
    it("should return false if already unlocked, regardless of spoils", () => {
      expect(canPurchaseUpgrade(100, 150, true)).toBe(false);
    });
  });
});
