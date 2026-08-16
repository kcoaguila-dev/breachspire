import { describe, it, expect } from 'vitest';
import { UnitStatsSchema } from '../src/data/schemas';
import { CombatTypeValues } from '../src/ecs/components';
import { getCombatMultiplier } from '../src/ecs/systems/CombatSystem';

import knightData from '../public/data/heroes/knight.json';
import warriorData from '../public/data/heroes/warrior.json';
import archerData from '../public/data/heroes/archer.json';
import mageData from '../public/data/heroes/mage.json';
import commanderData from '../public/data/heroes/commander.json';

import goblinData from '../public/data/monsters/goblin.json';
import trollData from '../public/data/monsters/troll.json';
import darkArcherData from '../public/data/monsters/dark_archer.json';
import cultistData from '../public/data/monsters/cultist.json';

const mapCombatTypeToValue = (type: string): number => {
  switch (type) {
    case 'melee': return CombatTypeValues.Melee;
    case 'ranged': return CombatTypeValues.Ranged;
    case 'magic': return CombatTypeValues.Magic;
    default: throw new Error(`Unknown combat type: ${type}`);
  }
};

describe('Archetypes JSON validation', () => {
  it('should parse hero JSON files correctly', () => {
    expect(UnitStatsSchema.safeParse(knightData).success).toBe(true);
    expect(UnitStatsSchema.safeParse(warriorData).success).toBe(true);
    expect(UnitStatsSchema.safeParse(archerData).success).toBe(true);
    expect(UnitStatsSchema.safeParse(mageData).success).toBe(true);
    expect(UnitStatsSchema.safeParse(commanderData).success).toBe(true);
  });

  it('should parse monster JSON files correctly', () => {
    expect(UnitStatsSchema.safeParse(goblinData).success).toBe(true);
    expect(UnitStatsSchema.safeParse(trollData).success).toBe(true);
    expect(UnitStatsSchema.safeParse(darkArcherData).success).toBe(true);
    expect(UnitStatsSchema.safeParse(cultistData).success).toBe(true);
  });
});

describe('RPS Combat Relationships Validation', () => {
  const allUnits = [
    knightData, warriorData, archerData, mageData, commanderData,
    goblinData, trollData, darkArcherData, cultistData
  ];

  it('should hold RPS relationships between all new hero and monster archetypes', () => {
    for (const attacker of allUnits) {
      for (const defender of allUnits) {
        const attackerType = mapCombatTypeToValue(attacker.combatType);
        const defenderType = mapCombatTypeToValue(defender.combatType);

        const mult = getCombatMultiplier(attackerType, defenderType);

        if (attacker.combatType === 'melee') {
          if (defender.combatType === 'ranged') expect(mult).toBe(1.5);
          else if (defender.combatType === 'magic') expect(mult).toBe(0.5);
          else expect(mult).toBe(1.0);
        } else if (attacker.combatType === 'ranged') {
          if (defender.combatType === 'magic') expect(mult).toBe(1.5);
          else if (defender.combatType === 'melee') expect(mult).toBe(0.5);
          else expect(mult).toBe(1.0);
        } else if (attacker.combatType === 'magic') {
          if (defender.combatType === 'melee') expect(mult).toBe(1.5);
          else if (defender.combatType === 'ranged') expect(mult).toBe(0.5);
          else expect(mult).toBe(1.0);
        }
      }
    }
  });
});
