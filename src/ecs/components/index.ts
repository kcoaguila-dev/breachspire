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

export const CommanderTag = defineComponent();

export enum SupportActionEnum {
  RallyFlag = 0,
  RepairWall = 1,
  AetherSurge = 2,
}

export const SoftFailRetreatComponent = defineComponent({
  isRetreating: Types.ui8,
  retreatTimer: Types.f32,
  savedLootRatio: Types.f32,
});

export const RunSpoilsComponent = defineComponent({
  spoils: Types.f32,
});

export const SupportRequestComponent = defineComponent({
  actionType: Types.ui8, // Maps to SupportActionEnum
  targetEid: Types.eid, // The entity this targets (e.g. wall or hero)
  requested: Types.ui8, // 1 = requested, 0 = fulfilled
});

export const SpriteComponent = defineComponent({
  textureId: Types.ui32, // Simplified way to map to a texture if needed, though we often map EID directly to Phaser Sprites
});

// ─────────────────────────────────────────────────────
// M5 Components
// ─────────────────────────────────────────────────────

export const CanReachElevated = defineComponent();

export const AlcoveNestComponent = defineComponent({
  floorId: Types.ui8,
  isOccupied: Types.ui8, // 1 = occupied, 0 = empty
});

export const FlightEnergyComponent = defineComponent({
  current: Types.f32,
  max: Types.f32,
  drainRate: Types.f32,
  rechargeRate: Types.f32,
  isAirborne: Types.ui8, // 1 = airborne, 0 = grounded
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

export const FloorDefenderComponent = defineComponent({
  floorEid: Types.eid,
  floorIndex: Types.ui8,
  spireSide: Types.ui8,
});

export const CampCoreComponent = defineComponent({
  lightEnergy: Types.f32,
  energyRate: Types.f32,
  maxEnergy: Types.f32,
  currentHP: Types.f32,
  maxHP: Types.f32,
});

export const InvasionSpawner = defineComponent({
  spireSide: Types.ui8, // 0 = Left, 1 = Right
  baseCooldown: Types.f32,
  spawnCooldown: Types.f32,
  timer: Types.f32,
  waveSize: Types.ui8,
  pendingGoblins: Types.ui16,
  pendingArchers: Types.ui16,
  pendingTrolls: Types.ui16,
});

export enum GameStateValues {
  RUNNING = 0,
  VICTORY = 1,
  DEFEAT = 2,
}

export const GameStateComponent = defineComponent({
  state: Types.ui8,
});

export enum WallTierValues {
  PalisadeWood = 1,
  MasonryStone = 2,
  IronSpikes = 3,
}

export const CampWallComponent = defineComponent({
  side: Types.ui8, // 0 = Left, 1 = Right
  hp: Types.f32,
  maxHp: Types.f32,
  tier: Types.ui8, // 1 = Wood (60 HP), 2 = Stone (120 HP), 3 = Iron Spikes (200 HP)
});

export const WatchtowerComponent = defineComponent({
  occupiedArcherEid: Types.eid,
  level: Types.ui8,
  rangeBonus: Types.f32,
  attackSpeedBonus: Types.f32,
});

// ─────────────────────────────────────────────────────
// M4 Components
// ─────────────────────────────────────────────────────

export const PlayerControlled = defineComponent({
  playerId: Types.ui8, // 1 or 2
  isControlled: Types.ui8,
});

export const CoopStateComponent = defineComponent({
  isCoopActive: Types.ui8, // 1 = active, 0 = inactive
  player1Eid: Types.eid,
  player2Eid: Types.eid,
});

export enum PoiTypeValues {
  AetherShrine = 0,
  Outpost = 1,
  ScoutingRuin = 2,
  VagrantCamp = 3,
  HammerStand = 4,
  BowStand = 5,
  SwordStand = 6,
  WatchtowerFoundation = 7,
}

export const WildernessPoiComponent = defineComponent({
  poiType: Types.ui8, // Use PoiTypeValues
  cost: Types.f32,
  isUnlocked: Types.ui8,
  respawnTimer: Types.f32,
  x: Types.f32,
});

export const InputStateComponent = defineComponent({
  left: Types.ui8,
  right: Types.ui8,
  up: Types.ui8,
  down: Types.ui8,
  attack: Types.ui8,
});

// ─────────────────────────────────────────────────────
// Kingdom Building & Recruitment Components
// ─────────────────────────────────────────────────────

export enum BlueprintStateValues {
  MOUND = 0,
  ORDERED = 1,
  BUILDING = 2,
  COMPLETED = 3,
}

export const WallBlueprint = defineComponent({
  state: Types.ui8,
  cost: Types.f32,
  woodCost: Types.ui16,
  ironCost: Types.ui16,
  targetTier: Types.ui8,
  progress: Types.f32,
  targetWallEid: Types.eid,
});

export enum RoleValues {
  PEASANT = 0,
  BUILDER = 1,
  ARCHER = 2,
  KNIGHT = 3,
}

export const UnitRole = defineComponent({
  role: Types.ui8,
  level: Types.ui8,
  xp: Types.f32,
  nextLevelXp: Types.f32,
  isConstructing: Types.ui8,
});

// ─────────────────────────────────────────────────────
// Phase 7 Components
// ─────────────────────────────────────────────────────

export const DamageTextEvent = defineComponent({
  targetX: Types.f32,
  targetY: Types.f32,
  amount: Types.f32,
  isAdvantage: Types.ui8,
  combatType: Types.ui8, // 0 = Melee, 1 = Ranged, 2 = Magic
});

export const LevelUpEvent = defineComponent({
  targetX: Types.f32,
  targetY: Types.f32,
  level: Types.ui8,
});

export const ScreenAlertComponent = defineComponent({
  leftFlankDanger: Types.ui8,
  rightFlankDanger: Types.ui8,
  shakeIntensity: Types.f32,
});

export const DestructionEvent = defineComponent({
  x: Types.f32,
  y: Types.f32,
  type: Types.ui8, // 0 = Floor Collapse, 1 = Wall Breach
});

// ─────────────────────────────────────────────────────
// Phase 8 Components
// ─────────────────────────────────────────────────────

export const DayNightCycle = defineComponent({
  timeOfDay: Types.f32,
  dayNumber: Types.ui16,
  isNight: Types.ui8,
});

export const AetherMoteComponent = defineComponent();

export const AetherCollectEvent = defineComponent({
  x: Types.f32,
  y: Types.f32,
});

// ─────────────────────────────────────────────────────
// Harvesting Components
// ─────────────────────────────────────────────────────

export enum HarvestableNodeValues {
  PineTree = 0,
  IronOre = 1,
}

export enum HarvestableStateValues {
  Natural = 0,
  Ordered = 1,
  BeingHarvested = 2,
  Depleted = 3,
}

export const HarvestableNode = defineComponent({
  nodeType: Types.ui8, // 0 = PineTree, 1 = IronOre
  state: Types.ui8, // 0 = Natural, 1 = Ordered, 2 = BeingHarvested, 3 = Depleted
  yieldCount: Types.ui8,
  progress: Types.f32,
});

export const CampStockComponent = defineComponent({
  wood: Types.f32,
  iron: Types.f32,
});
