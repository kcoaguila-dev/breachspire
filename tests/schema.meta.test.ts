import { describe, it, expect } from "vitest";
import { CampUpgradeSchema, CampUpgradeTreeSchema } from "../src/data/schemas";

describe("Camp Meta Upgrades Schema", () => {
  it("should parse valid upgrade JSON", () => {
    const validJson = {
      id: "upg_test_1",
      name: "Test Upgrade",
      description: "A test description.",
      cost: 50,
      effectType: "wall_hp",
      value: 100
    };

    const parsed = CampUpgradeSchema.safeParse(validJson);
    expect(parsed.success).toBe(true);
  });

  it("should fail on invalid effectType", () => {
    const invalidJson = {
      id: "upg_test_1",
      name: "Test Upgrade",
      description: "A test description.",
      cost: 50,
      effectType: "invalid_type",
      value: 100
    };

    const parsed = CampUpgradeSchema.safeParse(invalidJson);
    expect(parsed.success).toBe(false);
  });

  it("should fail on negative cost", () => {
    const invalidJson = {
      id: "upg_test_1",
      name: "Test Upgrade",
      description: "A test description.",
      cost: -50,
      effectType: "wall_hp",
      value: 100
    };

    const parsed = CampUpgradeSchema.safeParse(invalidJson);
    expect(parsed.success).toBe(false);
  });

  it("should parse valid upgrade tree JSON", () => {
    const validTree = [
      {
        id: "upg_test_1",
        name: "Test Upgrade 1",
        description: "Desc 1",
        cost: 50,
        effectType: "wall_hp",
        value: 100
      },
      {
        id: "upg_test_2",
        name: "Test Upgrade 2",
        description: "Desc 2",
        cost: 100,
        effectType: "recruit_slot",
        value: 1
      }
    ];

    const parsed = CampUpgradeTreeSchema.safeParse(validTree);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.length).toBe(2);
    }
  });
});
