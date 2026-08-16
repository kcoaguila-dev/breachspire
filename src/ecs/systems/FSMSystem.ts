import { defineQuery, IWorld } from "bitecs";
import { FSMState, FSMStateValues, Position, Velocity, Speed, Health, FactionTag } from "../components";

const fsmQuery = defineQuery([FSMState, Position, Velocity, Speed, FactionTag, Health]);
const aliveQuery = defineQuery([Health, Position, FactionTag]);

export function createFSMSystem() {
  return (world: IWorld, _delta: number) => {
    const entities = fsmQuery(world);
    const aliveEntities = aliveQuery(world);

    // Simple AI:
    // 1. If IDLE, look for an alive enemy. If found, change state to ENGAGE_TARGET and set target.
    // 2. If ENGAGE_TARGET, move towards target. If close enough, stop moving (combat system will handle attacks).

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      if (Health.current[eid] <= 0) {
        Velocity.x[eid] = 0;
        Velocity.y[eid] = 0;
        continue; // Dead entities don't do FSM
      }

      const state = FSMState.state[eid];
      const myFaction = FactionTag.faction[eid];

      if (state === FSMStateValues.IDLE) {
        // Find an enemy
        let closestEnemy = -1;
        let closestDist = Infinity;

        for(let j=0; j<aliveEntities.length; j++) {
            const potentialTarget = aliveEntities[j];
            if (potentialTarget === eid) continue;
            if (Health.current[potentialTarget] <= 0) continue;

            if (FactionTag.faction[potentialTarget] !== myFaction) {
                const dx = Position.x[potentialTarget] - Position.x[eid];
                const dy = Position.y[potentialTarget] - Position.y[eid];
                const distSq = dx*dx + dy*dy;
                if (distSq < closestDist) {
                    closestDist = distSq;
                    closestEnemy = potentialTarget;
                }
            }
        }

        if (closestEnemy !== -1) {
            FSMState.state[eid] = FSMStateValues.ENGAGE_TARGET;
            FSMState.targetEntity[eid] = closestEnemy;
        }

      } else if (state === FSMStateValues.ENGAGE_TARGET) {
        const targetEid = FSMState.targetEntity[eid];

        // If target is dead or invalid, go back to IDLE
        if (Health.current[targetEid] === undefined || Health.current[targetEid] <= 0) {
            FSMState.state[eid] = FSMStateValues.IDLE;
            Velocity.x[eid] = 0;
            Velocity.y[eid] = 0;
            continue;
        }

        // Move towards target
        const dx = Position.x[targetEid] - Position.x[eid];
        const dy = Position.y[targetEid] - Position.y[eid];
        const dist = Math.sqrt(dx*dx + dy*dy);

        const ENGAGE_DISTANCE = 50; // pixels

        if (dist > ENGAGE_DISTANCE) {
            const dirX = dx / dist;
            const dirY = dy / dist;
            const speed = Speed.value[eid];
            Velocity.x[eid] = dirX * speed;
            Velocity.y[eid] = dirY * speed;
        } else {
            // Close enough to attack
            Velocity.x[eid] = 0;
            Velocity.y[eid] = 0;
        }
      }
    }

    return world;
  };
}