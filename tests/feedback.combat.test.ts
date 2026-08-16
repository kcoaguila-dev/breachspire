import { describe, it, expect } from "vitest";
import { evaluateFlankDanger, computeDamageTextColor } from "../src/ecs/systems/CombatFeedbackSystem";

describe("Phase 7 - Combat Feedback Logic", () => {
  it("evaluates flank danger accurately (< 25% HP)", () => {
    // Both full health
    expect(evaluateFlankDanger(100, 100, 100, 100)).toEqual({
      leftDanger: false,
      rightDanger: false,
    });

    // Left danger exactly at 25% (should not trigger, must be < 25%)
    expect(evaluateFlankDanger(25, 100, 100, 100)).toEqual({
      leftDanger: false,
      rightDanger: false,
    });

    // Left danger < 25%
    expect(evaluateFlankDanger(24, 100, 100, 100)).toEqual({
      leftDanger: true,
      rightDanger: false,
    });

    // Right danger < 25%
    expect(evaluateFlankDanger(100, 100, 20, 100)).toEqual({
      leftDanger: false,
      rightDanger: true,
    });

    // Both danger
    expect(evaluateFlankDanger(10, 100, 10, 100)).toEqual({
      leftDanger: true,
      rightDanger: true,
    });
  });

  it("computes damage text color based on multiplier", () => {
    // Advantage
    expect(computeDamageTextColor(1.5)).toBe("#FFD700");

    // Disadvantage
    expect(computeDamageTextColor(0.5)).toBe("#AAAAAA");

    // Neutral
    expect(computeDamageTextColor(1.0)).toBe("#FFFFFF");
  });
});
