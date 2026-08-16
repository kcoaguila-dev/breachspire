import { z } from "zod";

// ─────────────────────────────────────────────────────
// Shared enums
// ─────────────────────────────────────────────────────

// Faction: "hero" maps to FactionValues.Hero (0), "monster" maps to FactionValues.Monster (1)
export const FactionEnum = z.enum(["hero", "monster"]);
export type Faction = z.infer<typeof FactionEnum>;

// Combat Type for RPS system: Melee > Ranged > Magic > Melee
export const CombatTypeEnum = z.enum(["melee", "ranged", "magic"]);
export type CombatType = z.infer<typeof CombatTypeEnum>;

// ─────────────────────────────────────────────────────
// M1 — Unit archetype schema (heroes + monsters)
// Lives in: public/data/heroes/*.json, public/data/monsters/*.json
// ─────────────────────────────────────────────────────
export const UnitStatsSchema = z.object({
  id:               z.string(),
  name:             z.string(),
  faction:          FactionEnum,
  combatType:       CombatTypeEnum,
  health:           z.number().int().positive(),
  attack:           z.number().int().positive(),
  speed:            z.number().positive(),
  canReachElevated: z.boolean().optional(),
  flightEnergyMax:  z.number().optional(),
  flightDrainRate:  z.number().optional(),
});
export type UnitStats = z.infer<typeof UnitStatsSchema>;

// ─────────────────────────────────────────────────────
// M2 — Floor definition schema
// Lives in: public/data/floors/floor_NN.json
// One JSON file per tower floor. floorId is 1-indexed.
// ─────────────────────────────────────────────────────
export const FloorDataSchema = z.object({
  // 1-indexed floor number. Floor 1 = bottom of tower (closest to gate).
  floorId:       z.number().int().min(1),
  // Max monsters that can spawn on this floor during a raid.
  monsterBudget: z.number().int().positive(),
  // HP of the barricade blocking the ladder to the next floor.
  barricadeHP:   z.number().int().positive(),
  // If true, this floor has an archer alcove nest — only reachable by flying units.
  hasAlcoveNest: z.boolean(),
});
export type FloorData = z.infer<typeof FloorDataSchema>;
// ─────────────────────────────────────────────────────
// M2 — Camp and Spire config schemas
// ─────────────────────────────────────────────────────

export const CampConfigSchema = z.object({
  startingLightEnergy: z.number().nonnegative(),
  energyRate:          z.number().nonnegative(),
  maxLightEnergy:      z.number().positive(),
  leftWallHP:          z.number().positive(),
  rightWallHP:         z.number().positive(),
});
export type CampConfig = z.infer<typeof CampConfigSchema>;

export const SpireConfigSchema = z.object({
  startingDarkEnergy: z.number().nonnegative(),
  darkEnergyRate:     z.number().nonnegative(),
  floorGrowthCost:    z.number().positive(),
  maxFloors:          z.number().int().positive(),
  crystalMaxHP:       z.number().positive(),
  initialFloors:      z.number().int().nonnegative(),
});
export type SpireConfig = z.infer<typeof SpireConfigSchema>;

export const CampUpgradeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  cost: z.number().int().positive(),
  effectType: z.enum(["wall_hp", "energy_rate", "flight_duration", "recruit_slot"]),
  value: z.number()
});
export type CampUpgrade = z.infer<typeof CampUpgradeSchema>;

export const CampUpgradeTreeSchema = z.array(CampUpgradeSchema);
export type CampUpgradeTree = z.infer<typeof CampUpgradeTreeSchema>;
