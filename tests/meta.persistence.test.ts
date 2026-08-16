import { describe, it, expect } from "vitest";
import {
  CampSaveState,
  serializeSaveState,
  deserializeSaveState,
  calculateUpgradeBonuses
} from "../src/persistence/RunStateManager";
import { CampUpgrade } from "../src/data/schemas";

describe("Meta Progression Persistence", () => {
  const dummyUpgrades: CampUpgrade[] = [
    {
      id: "upg_wall_1",
      name: "Wall HP I",
      description: "Increase Wall HP",
      cost: 100,
      effectType: "wall_hp",
      value: 500
    },
    {
      id: "upg_energy_1",
      name: "Energy Rate I",
      description: "Increase Energy Rate",
      cost: 100,
      effectType: "energy_rate",
      value: 2
    },
    {
      id: "upg_flight_1",
      name: "Flight I",
      description: "Increase Flight Duration",
      cost: 100,
      effectType: "flight_duration",
      value: 15
    }
  ];

  it("should serialize state correctly", () => {
    const state: CampSaveState = {
      runCount: 5,
      unlockedUpgrades: ["upg_wall_1", "upg_energy_1"],
      totalAetherEarned: 1500,
      recruitedHeroes: ["warrior", "archer"]
    };

    const json = serializeSaveState(state);
    expect(json).toBe('{"runCount":5,"unlockedUpgrades":["upg_wall_1","upg_energy_1"],"totalAetherEarned":1500,"recruitedHeroes":["warrior","archer"]}');
  });

  it("should deserialize state correctly", () => {
    const json = '{"runCount":5,"unlockedUpgrades":["upg_wall_1"],"totalAetherEarned":1500,"recruitedHeroes":["warrior"]}';
    const state = deserializeSaveState(json);

    expect(state.runCount).toBe(5);
    expect(state.unlockedUpgrades).toEqual(["upg_wall_1"]);
    expect(state.totalAetherEarned).toBe(1500);
    expect(state.recruitedHeroes).toEqual(["warrior"]);
  });

  it("should fallback to default state on corrupted JSON", () => {
    const json = '{"runCount": "invalid", "unlockedUpgrades": null'; // Missing bracket
    const state = deserializeSaveState(json);

    expect(state.runCount).toBe(0);
    expect(state.unlockedUpgrades).toEqual([]);
    expect(state.totalAetherEarned).toBe(0);
    expect(state.recruitedHeroes).toEqual([]);
  });

  it("should fallback cleanly if valid JSON but wrong types", () => {
    const json = '{"runCount": "5", "unlockedUpgrades": "upg_wall_1", "totalAetherEarned": "1500", "recruitedHeroes": "warrior"}';
    const state = deserializeSaveState(json);

    expect(state.runCount).toBe(0);
    expect(state.unlockedUpgrades).toEqual([]);
    expect(state.totalAetherEarned).toBe(0);
    expect(state.recruitedHeroes).toEqual([]);
  });

  it("should calculate upgrade bonuses correctly", () => {
    const unlocked = ["upg_wall_1", "upg_flight_1"];
    const bonuses = calculateUpgradeBonuses(unlocked, dummyUpgrades);

    expect(bonuses.wallHpBonus).toBe(500);
    expect(bonuses.energyRateBonus).toBe(0);
    expect(bonuses.flightBonus).toBe(15);
  });
});
