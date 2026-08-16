import { z } from "zod";

// Faction: 0 = Hero, 1 = Monster
export const FactionEnum = z.enum(["hero", "monster"]);
export type Faction = z.infer<typeof FactionEnum>;

// Combat Type for RPS system
// Melee > Ranged > Magic > Melee
export const CombatTypeEnum = z.enum(["melee", "ranged", "magic"]);
export type CombatType = z.infer<typeof CombatTypeEnum>;

export const UnitStatsSchema = z.object({
  id: z.string(),
  name: z.string(),
  faction: FactionEnum,
  combatType: CombatTypeEnum,
  health: z.number().int().positive(),
  attack: z.number().int().positive(),
  speed: z.number().positive(),
});

export type UnitStats = z.infer<typeof UnitStatsSchema>;