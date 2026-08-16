import { createWorld, addEntity, addComponent, IWorld } from "bitecs";
import { UnitStats, CampConfig, SpireConfig } from "../data/schemas";
import {
  Position,
  Health,
  Attack,
  Speed,
  CombatTypeComponent,
  CombatTypeValues,
  FactionTag,
  FactionValues,
  FSMState,
  FSMStateValues,
  Velocity,
  SpireComponent,
  SpireSideValues,
  FloorComponent,
  FloorCrystalComponent,
  CampCoreComponent,
  CampWallComponent,
  PlayerControlled,
  InputStateComponent,
  CanReachElevated,
  FlightEnergyComponent,
} from "./components";

export const world = createWorld();

export function createUnitEntity(
  world: IWorld,
  stats: UnitStats,
  x: number,
  y: number
): number {
  const entity = addEntity(world);

  addComponent(world, Position, entity);
  Position.x[entity] = x;
  Position.y[entity] = y;

  addComponent(world, Velocity, entity);
  Velocity.x[entity] = 0;
  Velocity.y[entity] = 0;

  addComponent(world, Health, entity);
  Health.max[entity] = stats.health;
  Health.current[entity] = stats.health;

  addComponent(world, Attack, entity);
  Attack.power[entity] = stats.attack;

  addComponent(world, Speed, entity);
  Speed.value[entity] = stats.speed;

  addComponent(world, CombatTypeComponent, entity);
  CombatTypeComponent.type[entity] =
    stats.combatType === "melee" ? CombatTypeValues.Melee :
    stats.combatType === "ranged" ? CombatTypeValues.Ranged :
    CombatTypeValues.Magic;

  addComponent(world, FactionTag, entity);
  FactionTag.faction[entity] = stats.faction === "hero" ? FactionValues.Hero : FactionValues.Monster;

  addComponent(world, FSMState, entity);
  FSMState.state[entity] = FSMStateValues.IDLE;
  FSMState.targetEntity[entity] = 0;

  if (stats.canReachElevated) {
    addComponent(world, CanReachElevated, entity);
  }

  if (stats.flightEnergyMax !== undefined) {
    addComponent(world, FlightEnergyComponent, entity);
    FlightEnergyComponent.max[entity] = stats.flightEnergyMax;
    FlightEnergyComponent.current[entity] = stats.flightEnergyMax;
    FlightEnergyComponent.drainRate[entity] = stats.flightDrainRate ?? 1.0;
    FlightEnergyComponent.rechargeRate[entity] = 2.0; // Default recharge rate
    FlightEnergyComponent.isAirborne[entity] = 0;
  }

  return entity;
}

import { GameStateComponent, GameStateValues, InvasionSpawner, DayNightCycle } from "./components";

export function createGameStateEntity(world: IWorld): number {
  const entity = addEntity(world);
  addComponent(world, GameStateComponent, entity);
  GameStateComponent.state[entity] = GameStateValues.RUNNING;
  return entity;
}

export function createInvasionSpawner(world: IWorld, spireEntity: number, side: SpireSideValues, cooldown: number, waveSize: number): number {
  // We can attach it directly to the spire entity
  addComponent(world, InvasionSpawner, spireEntity);
  InvasionSpawner.spireSide[spireEntity] = side;
  InvasionSpawner.baseCooldown[spireEntity] = cooldown;
  InvasionSpawner.spawnCooldown[spireEntity] = cooldown;
  InvasionSpawner.timer[spireEntity] = 0;
  InvasionSpawner.waveSize[spireEntity] = waveSize;
  return spireEntity;
}

// ─────────────────────────────────────────────────────
// M2 Factories
// ─────────────────────────────────────────────────────

export function createCampCoreEntity(
  world: IWorld,
  config: CampConfig,
  x: number,
  y: number
): number {
  const entity = addEntity(world);

  addComponent(world, Position, entity);
  Position.x[entity] = x;
  Position.y[entity] = y;

  addComponent(world, CampCoreComponent, entity);
  CampCoreComponent.lightEnergy[entity] = config.startingLightEnergy;
  CampCoreComponent.energyRate[entity] = config.energyRate;
  CampCoreComponent.maxEnergy[entity] = config.maxLightEnergy;

  // Added health components for core
  addComponent(world, Health, entity);
  const coreHP = 1000; // Example HP
  Health.current[entity] = coreHP;
  Health.max[entity] = coreHP;
  CampCoreComponent.currentHP[entity] = coreHP;
  CampCoreComponent.maxHP[entity] = coreHP;

  return entity;
}

export function createCampWallEntity(
  world: IWorld,
  config: CampConfig,
  side: SpireSideValues,
  x: number,
  y: number
): number {
  const entity = addEntity(world);

  addComponent(world, Position, entity);
  Position.x[entity] = x;
  Position.y[entity] = y;

  const hp = side === SpireSideValues.Left ? config.leftWallHP : config.rightWallHP;

  addComponent(world, Health, entity);
  Health.current[entity] = hp;
  Health.max[entity] = hp;

  addComponent(world, CampWallComponent, entity);
  CampWallComponent.side[entity] = side;
  CampWallComponent.hp[entity] = hp;
  CampWallComponent.maxHp[entity] = hp;

  return entity;
}

export function createSpireEntity(
  world: IWorld,
  config: SpireConfig,
  side: SpireSideValues,
  x: number,
  y: number
): number {
  const entity = addEntity(world);

  addComponent(world, Position, entity);
  Position.x[entity] = x;
  Position.y[entity] = y;

  addComponent(world, SpireComponent, entity);
  SpireComponent.side[entity] = side;
  SpireComponent.darkEnergy[entity] = config.startingDarkEnergy;
  SpireComponent.darkEnergyRate[entity] = config.darkEnergyRate;
  SpireComponent.growthCost[entity] = config.floorGrowthCost;
  SpireComponent.floorCount[entity] = config.initialFloors;
  SpireComponent.maxFloors[entity] = config.maxFloors;
  SpireComponent.crystalHP[entity] = config.crystalMaxHP;
  SpireComponent.isAlive[entity] = 1;

  // Spire acts as an entity with health
  addComponent(world, Health, entity);
  Health.current[entity] = config.crystalMaxHP;
  Health.max[entity] = config.crystalMaxHP;

  // Add initial floors
  // Base floor (1) is at Y=650, each subsequent floor is 120px higher
  const baseY = 650;
  for (let i = 1; i <= config.initialFloors; i++) {
    createFloorEntity(world, side, i, entity, x, baseY - (i - 1) * 120);
  }

  return entity;
}

export function createFloorEntity(
  world: IWorld,
  side: SpireSideValues,
  floorIndex: number,
  spireEid: number,
  x: number,
  y: number
): number {
  const entity = addEntity(world);

  addComponent(world, Position, entity);
  Position.x[entity] = x;
  Position.y[entity] = y;

  addComponent(world, FloorComponent, entity);
  FloorComponent.spireSide[entity] = side;
  FloorComponent.floorIndex[entity] = floorIndex;
  FloorComponent.barricadeHP[entity] = 0; // Legacy
  FloorComponent.cleared[entity] = 0;
  FloorComponent.active[entity] = 1;

  // Add crystal for this floor
  addComponent(world, FloorCrystalComponent, entity);
  FloorCrystalComponent.floorIndex[entity] = floorIndex;
  FloorCrystalComponent.spireEid[entity] = spireEid;
  FloorCrystalComponent.isDestroyed[entity] = 0;

  addComponent(world, Health, entity);
  Health.current[entity] = 500;
  Health.max[entity] = 500;

  return entity;
}

export function setPlayerControlled(world: IWorld, entity: number, playerId: number = 1): void {
  addComponent(world, PlayerControlled, entity);
  PlayerControlled.isControlled[entity] = 1;
  PlayerControlled.playerId[entity] = playerId;

  addComponent(world, InputStateComponent, entity);
  InputStateComponent.left[entity] = 0;
  InputStateComponent.right[entity] = 0;
  InputStateComponent.up[entity] = 0;
  InputStateComponent.down[entity] = 0;
  InputStateComponent.attack[entity] = 0;
}

export function createDayNightEntity(world: IWorld): number {
  const entity = addEntity(world);
  addComponent(world, DayNightCycle, entity);
  DayNightCycle.timeOfDay[entity] = 0;
  DayNightCycle.dayNumber[entity] = 1;
  DayNightCycle.isNight[entity] = 0;
  return entity;
}
