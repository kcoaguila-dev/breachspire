import { defineComponent, Types } from "bitecs";

export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32,
});

export const Velocity = defineComponent({
  x: Types.f32,
  y: Types.f32,
});

export const Health = defineComponent({
  current: Types.f32,
  max: Types.f32,
});

export const Attack = defineComponent({
  power: Types.f32,
});

export const Speed = defineComponent({
  value: Types.f32,
});

export enum CombatTypeValues {
  Melee = 0,
  Ranged = 1,
  Magic = 2,
}

export const CombatTypeComponent = defineComponent({
  type: Types.ui8, // 0 = Melee, 1 = Ranged, 2 = Magic
});

export enum FactionValues {
  Hero = 0,
  Monster = 1,
}

export const FactionTag = defineComponent({
  faction: Types.ui8, // 0 = Hero, 1 = Monster
});

export enum FSMStateValues {
  IDLE = 0,
  MOVE_TO_LADDER = 1,
  ENGAGE_TARGET = 2,
  ATTACK_BARRICADE = 3,
  FLEE = 4,
}

export const FSMState = defineComponent({
  state: Types.ui8, // e.g. 0=IDLE, 1=MOVE_TO_LADDER, 2=ENGAGE_TARGET, 3=ATTACK_BARRICADE, 4=FLEE
  targetEntity: Types.eid, // Target entity ID
});

export const SpriteComponent = defineComponent({
  textureId: Types.ui32, // Simplified way to map to a texture if needed, though we often map EID directly to Phaser Sprites
});
// ─────────────────────────────────────────────────────
// M2 Components
// ─────────────────────────────────────────────────────

export enum SpireSideValues {
  Left = 0,
  Right = 1,
}

export const SpireComponent = defineComponent({
  side: Types.ui8,
  darkEnergy: Types.f32,
  growthCost: Types.f32,
  floorCount: Types.ui8,
  maxFloors: Types.ui8,
  crystalHP: Types.f32,
  darkEnergyRate: Types.f32,
  isAlive: Types.ui8, // 1 = true, 0 = false
});

export const FloorComponent = defineComponent({
  spireSide: Types.ui8,
  floorIndex: Types.ui8,
  barricadeHP: Types.f32,
  cleared: Types.ui8, // 1 = true, 0 = false
  active: Types.ui8,  // 1 = true, 0 = false
});

export const CampCoreComponent = defineComponent({
  lightEnergy: Types.f32,
  energyRate: Types.f32,
  maxEnergy: Types.f32,
});

export const CampWallComponent = defineComponent({
  side: Types.ui8, // 0 = Left, 1 = Right
  hp: Types.f32,
  maxHp: Types.f32,
});
