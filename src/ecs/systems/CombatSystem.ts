import { defineQuery, IWorld, addEntity, addComponent, hasComponent } from "bitecs";
import { Health, Attack, CombatTypeComponent, CombatTypeValues, FSMState, FSMStateValues, Position, DamageTextEvent, UnitRole, PlayerControlled, GameStateComponent, GameStateValues, CampWallComponent, CampCoreComponent, AetherMoteComponent } from "../components";
import { calculateThornsDamage } from "./BuildingSystem";

const combatQuery = defineQuery([Health, Attack, CombatTypeComponent, FSMState, Position]);
const stateQuery = defineQuery([GameStateComponent]);
const playerQuery = defineQuery([PlayerControlled, Position, Health]);
const coreQuery = defineQuery([CampCoreComponent]);

// Multiplier constants
const ADVANTAGE_MULTIPLIER = 1.5;
const DISADVANTAGE_MULTIPLIER = 0.5;
const NEUTRAL_MULTIPLIER = 1.0;

export interface PlayerDamageResult {
  remainingEnergy: number;
  isLethal: boolean;
  energyDrained: number;
}

export function calculatePlayerEnergyDamage(currentEnergy: number, incomingDamage: number): PlayerDamageResult {
  if (currentEnergy <= 0 || incomingDamage >= currentEnergy) {
    return { remainingEnergy: 0, isLethal: true, energyDrained: currentEnergy };
  }
  return { remainingEnergy: currentEnergy - incomingDamage, isLethal: false, energyDrained: incomingDamage };
}

// Determines multiplier for attacker vs defender
export function getCombatMultiplier(attackerType: number, defenderType: number): number {
  if (attackerType === defenderType) return NEUTRAL_MULTIPLIER;

  // Melee (0) > Ranged (1)
  if (attackerType === CombatTypeValues.Melee && defenderType === CombatTypeValues.Ranged) return ADVANTAGE_MULTIPLIER;
  if (attackerType === CombatTypeValues.Ranged && defenderType === CombatTypeValues.Melee) return DISADVANTAGE_MULTIPLIER;

  // Ranged (1) > Magic (2)
  if (attackerType === CombatTypeValues.Ranged && defenderType === CombatTypeValues.Magic) return ADVANTAGE_MULTIPLIER;
  if (attackerType === CombatTypeValues.Magic && defenderType === CombatTypeValues.Ranged) return DISADVANTAGE_MULTIPLIER;

  // Magic (2) > Melee (0)
  if (attackerType === CombatTypeValues.Magic && defenderType === CombatTypeValues.Melee) return ADVANTAGE_MULTIPLIER;
  if (attackerType === CombatTypeValues.Melee && defenderType === CombatTypeValues.Magic) return DISADVANTAGE_MULTIPLIER;

  return NEUTRAL_MULTIPLIER;
}

export function createCombatSystem() {
  // Simple cooldown map (entityId -> cooldown remaining in ms)
  const attackCooldowns = new Map<number, number>();
  const BASE_COOLDOWN = 1000; // 1 second between attacks

  return (world: IWorld, delta: number) => {
    const entities = combatQuery(world);

    // Update cooldowns
    for (const [eid, cd] of attackCooldowns.entries()) {
      if (cd > 0) {
        attackCooldowns.set(eid, cd - delta);
      }
    }

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      if (hasComponent(world, PlayerControlled, eid)) {
        continue; // The Commander is a non-combatant leader managing kingdom economy
      }
      if (Health.current[eid] <= 0) continue;

      const state = FSMState.state[eid];
      if (state !== FSMStateValues.ENGAGE_TARGET) continue;

      const targetEid = FSMState.targetEntity[eid];
      const ENGAGE_DISTANCE = 55; // slightly larger than FSM target stop distance to allow attacking

      // Dynamic retargeting for defensive entities or nearby Player on horseback
      const players = playerQuery(world);
      let attackTarget = targetEid;
      let inRange = false;

      // Check if original target is in range
      if (Health.current[targetEid] > 0) {
        const dx = Position.x[targetEid] - Position.x[eid];
        const dy = Position.y[targetEid] - Position.y[eid];
        if (Math.sqrt(dx * dx + dy * dy) <= ENGAGE_DISTANCE) {
          inRange = true;
        }
      }

      // If player is in close melee range (<= 55px), monster prioritizes player!
      for (let p = 0; p < players.length; p++) {
        const pEid = players[p];
        if (Health.current[pEid] > 0) {
          const pdx = Position.x[pEid] - Position.x[eid];
          const pdy = Position.y[pEid] - Position.y[eid];
          if (Math.sqrt(pdx * pdx + pdy * pdy) <= ENGAGE_DISTANCE) {
            attackTarget = pEid;
            inRange = true;
            break;
          }
        }
      }

      if (inRange && attackTarget !== -1) {
        const cd = attackCooldowns.get(eid) || 0;
        if (cd <= 0) {
          // Attack!
          const attackerType = CombatTypeComponent.type[eid];
          const defenderType = CombatTypeComponent.type[attackTarget];

          const multiplier = getCombatMultiplier(attackerType, defenderType);
          let baseDamage = Attack.power[eid];

          if (hasComponent(world, UnitRole, eid)) {
            const lvl = UnitRole.level[eid];
            if (lvl === 2) baseDamage *= 1.3;
            if (lvl >= 3) baseDamage *= 1.7;
            UnitRole.xp[eid] += 10;
          }

          const finalDamage = baseDamage * multiplier;

          if (hasComponent(world, PlayerControlled, targetEid) || hasComponent(world, PlayerControlled, attackTarget)) {
            const hitPlayerEid = hasComponent(world, PlayerControlled, attackTarget) ? attackTarget : targetEid;
            const cores = coreQuery(world);
            const coreEid = cores.length > 0 ? cores[0] : -1;
            const curEnergy = coreEid !== -1 ? CampCoreComponent.lightEnergy[coreEid] : 0;

            const res = calculatePlayerEnergyDamage(curEnergy, finalDamage);

            if (res.isLethal) {
              Health.current[hitPlayerEid] = 0;
              if (coreEid !== -1) CampCoreComponent.lightEnergy[coreEid] = 0;
              const states = stateQuery(world);
              if (states.length > 0) {
                GameStateComponent.state[states[0]] = GameStateValues.DEFEAT;
              }
            } else {
              // Deduct from shared energy pool
              if (coreEid !== -1) {
                CampCoreComponent.lightEnergy[coreEid] = res.remainingEnergy;
              }
              // Scatter 1-2 Aether Motes around hit player
              const px = Position.x[hitPlayerEid];
              const py = Position.y[hitPlayerEid];
              const moteEid = addEntity(world);
              addComponent(world, Position, moteEid);
              Position.x[moteEid] = px + (Math.random() * 50 - 25);
              Position.y[moteEid] = py - 10;
              addComponent(world, AetherMoteComponent, moteEid);
              AetherMoteComponent.value[moteEid] = 5;
              AetherMoteComponent.lifetime[moteEid] = 18000;
              AetherMoteComponent.maxLifetime[moteEid] = 18000;
            }
          } else {
            Health.current[attackTarget] = Math.max(0, Health.current[attackTarget] - finalDamage);

            // Thorns reflection for Tier 3 Iron Spiked walls
            if (hasComponent(world, CampWallComponent, attackTarget)) {
              const tier = CampWallComponent.tier[attackTarget];
              const thorns = calculateThornsDamage(tier, finalDamage);
              if (thorns > 0) {
                Health.current[eid] = Math.max(0, Health.current[eid] - thorns);
              }
            }
          }

          // AUDIO: We can't easily play audio here because we don't have audioManager,
          // but we can spawn an AudioEvent or just rely on the feedback system playing
          // sounds based on the DamageTextEvent. Let's add sound playing based on attack type in CombatFeedbackSystem.

          // Phase 7: Spawn DamageTextEvent
          const eventEid = addEntity(world);
          addComponent(world, DamageTextEvent, eventEid);
          DamageTextEvent.targetX[eventEid] = Position.x[attackTarget];
          DamageTextEvent.targetY[eventEid] = Position.y[attackTarget] - 30; // Float slightly above
          DamageTextEvent.amount[eventEid] = finalDamage;
          DamageTextEvent.isAdvantage[eventEid] = multiplier > 1.0 ? 2 : (multiplier < 1.0 ? 0 : 1);
          DamageTextEvent.combatType[eventEid] = attackerType;

          attackCooldowns.set(eid, BASE_COOLDOWN);
        }
      }
    }

    return world;
  };
}