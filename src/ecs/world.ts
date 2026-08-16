import { createWorld, addEntity, addComponent, IWorld } from "bitecs";
import { UnitStats } from "../data/schemas";
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

  return entity;
}