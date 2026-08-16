import { describe, it, expect } from "vitest";
import { isDead } from "../src/ecs/systems/DeathSystem";

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
});
