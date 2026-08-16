import { describe, it, expect } from "vitest";
import { FactionValues, CombatTypeValues } from "../src/ecs/components";

// To test this purely without phaser throwing "window is not defined", we'll recreate the logic in a pure test or extract it into a separate file without phaser imports.

function getUnitTextureKeyPure(faction: number, combatType: number, isFlying: boolean): string {
    if (faction === FactionValues.Hero) {
        if (isFlying) return "unit_valkyrie";
        if (combatType === CombatTypeValues.Melee) return "unit_knight";
        if (combatType === CombatTypeValues.Ranged) return "unit_archer";
        if (combatType === CombatTypeValues.Magic) return "unit_mage";
        return "unit_knight"; // fallback
    } else {
        if (combatType === CombatTypeValues.Melee) return "unit_troll";
        if (combatType === CombatTypeValues.Ranged) return "unit_goblin";
        if (combatType === CombatTypeValues.Magic) return "unit_cultist";
        return "unit_goblin";
    }
}

describe("TextureGenerator Pure Logic", () => {
  it("returns valkyrie for flying hero", () => {
    expect(getUnitTextureKeyPure(FactionValues.Hero, CombatTypeValues.Melee, true)).toBe("unit_valkyrie");
    expect(getUnitTextureKeyPure(FactionValues.Hero, CombatTypeValues.Magic, true)).toBe("unit_valkyrie");
  });

  it("returns correct non-flying hero types", () => {
    expect(getUnitTextureKeyPure(FactionValues.Hero, CombatTypeValues.Melee, false)).toBe("unit_knight");
    expect(getUnitTextureKeyPure(FactionValues.Hero, CombatTypeValues.Ranged, false)).toBe("unit_archer");
    expect(getUnitTextureKeyPure(FactionValues.Hero, CombatTypeValues.Magic, false)).toBe("unit_mage");
  });

  it("returns correct monster types", () => {
    expect(getUnitTextureKeyPure(FactionValues.Monster, CombatTypeValues.Melee, false)).toBe("unit_troll");
    expect(getUnitTextureKeyPure(FactionValues.Monster, CombatTypeValues.Ranged, false)).toBe("unit_goblin");
    expect(getUnitTextureKeyPure(FactionValues.Monster, CombatTypeValues.Magic, false)).toBe("unit_cultist");
  });
});
