import { defineQuery, IWorld } from "bitecs";
import { Health, Attack, CombatTypeComponent, CombatTypeValues, FSMState, FSMStateValues, Position } from "../components";

const combatQuery = defineQuery([Health, Attack, CombatTypeComponent, FSMState, Position]);

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
          const baseDamage = Attack.power[eid];
          const finalDamage = baseDamage * multiplier;

          Health.current[targetEid] -= finalDamage;
          // console.log(`Entity ${eid} attacks ${targetEid} for ${finalDamage} damage! (${Health.current[targetEid]} HP remaining)`);

          attackCooldowns.set(eid, BASE_COOLDOWN);
        }
      }
    }

    return world;
  };
}