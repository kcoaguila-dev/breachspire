import { defineQuery, IWorld, addEntity, addComponent, hasComponent } from "bitecs";
import { Health, Attack, CombatTypeComponent, CombatTypeValues, FSMState, FSMStateValues, Position, DamageTextEvent, UnitRole, PlayerControlled, GameStateComponent, GameStateValues, CampWallComponent } from "../components";
import { shouldLeaderDieFromAttack } from "./GameStateSystem";
import { calculateThornsDamage } from "./BuildingSystem";

const combatQuery = defineQuery([Health, Attack, CombatTypeComponent, FSMState, Position]);
const stateQuery = defineQuery([GameStateComponent]);

// Multiplier constants
const ADVANTAGE_MULTIPLIER = 1.5;
const DISADVANTAGE_MULTIPLIER = 0.5;
const NEUTRAL_MULTIPLIER = 1.0;

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
      if (Health.current[targetEid] === undefined || Health.current[targetEid] <= 0) continue;

      // Check distance
      const dx = Position.x[targetEid] - Position.x[eid];
      const dy = Position.y[targetEid] - Position.y[eid];
      const dist = Math.sqrt(dx*dx + dy*dy);

      const ENGAGE_DISTANCE = 55; // slightly larger than FSM target stop distance to allow attacking

      if (dist <= ENGAGE_DISTANCE) {
        const cd = attackCooldowns.get(eid) || 0;
        if (cd <= 0) {
          // Attack!
          const attackerType = CombatTypeComponent.type[eid];
          const defenderType = CombatTypeComponent.type[targetEid];

          const multiplier = getCombatMultiplier(attackerType, defenderType);
          let baseDamage = Attack.power[eid];

          if (hasComponent(world, UnitRole, eid)) {
            const lvl = UnitRole.level[eid];
            if (lvl === 2) baseDamage *= 1.3;
            if (lvl >= 3) baseDamage *= 1.7;
            UnitRole.xp[eid] += 10;
          }

          const finalDamage = baseDamage * multiplier;

          if (hasComponent(world, PlayerControlled, targetEid)) {
            if (shouldLeaderDieFromAttack(true, finalDamage)) {
               Health.current[targetEid] = 0;
               const states = stateQuery(world);
               if (states.length > 0) {
                 GameStateComponent.state[states[0]] = GameStateValues.DEFEAT;
               }
            }
          } else {
            Health.current[targetEid] = Math.max(0, Health.current[targetEid] - finalDamage);

            // Thorns reflection for Tier 3 Iron Spiked walls
            if (hasComponent(world, CampWallComponent, targetEid)) {
              const tier = CampWallComponent.tier[targetEid];
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
          DamageTextEvent.targetX[eventEid] = Position.x[targetEid];
          DamageTextEvent.targetY[eventEid] = Position.y[targetEid] - 30; // Float slightly above
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