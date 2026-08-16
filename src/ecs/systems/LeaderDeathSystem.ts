import { defineQuery, IWorld, addComponent, hasComponent } from "bitecs";
import {
  PlayerControlled,
  Health,
  FSMState,
  FSMStateValues,
  SoftFailRetreatComponent,
  Position,
  CampCoreComponent,
  RunSpoilsComponent
} from "../components";

// ─────────────────────────────────────────────────────
// EXPORTED PURE LOGIC — testable by Vitest without Phaser or world
// ─────────────────────────────────────────────────────
export function calculateRetainedLoot(currentLoot: number, retentionRatio: number): number {
  return Math.max(0, currentLoot * retentionRatio);
}

export function shouldTriggerSoftFail(isPlayerControlled: boolean, hp: number): boolean {
  return isPlayerControlled && hp <= 0;
}

// ─────────────────────────────────────────────────────
// SYSTEM FACTORY
// ─────────────────────────────────────────────────────
const leaderQuery = defineQuery([PlayerControlled, Health, FSMState, Position]);
const campCoreQuery = defineQuery([CampCoreComponent, Position]);

export function createLeaderDeathSystem() {
  return (world: IWorld, _delta: number): IWorld => {
    const cores = campCoreQuery(world);
    if (cores.length === 0) return world; // Cannot retreat if no camp core

    const coreEid = cores[0];
    const coreX = Position.x[coreEid];
    const coreY = Position.y[coreEid];

    const leaders = leaderQuery(world);

    for (let i = 0; i < leaders.length; i++) {
      const eid = leaders[i];
      const hp = Health.current[eid];

      if (shouldTriggerSoftFail(true, hp)) {
        // Soft fail logic
        Health.current[eid] = Health.max[eid] * 0.25; // Revive with 25% max HP

        // Change FSM state to flee/retreat
        FSMState.state[eid] = FSMStateValues.FLEE;
        FSMState.targetEntity[eid] = coreEid;

        // Ensure entity is moved back to base camp
        Position.x[eid] = coreX;
        Position.y[eid] = coreY;

        // Apply retreat component
        if (!hasComponent(world, SoftFailRetreatComponent, eid)) {
          addComponent(world, SoftFailRetreatComponent, eid);
          SoftFailRetreatComponent.isRetreating[eid] = 1;
          SoftFailRetreatComponent.retreatTimer[eid] = 5000; // e.g. 5 seconds penalty
          SoftFailRetreatComponent.savedLootRatio[eid] = 0.5; // retain 50%
        }

        // Retain partial loot
        if (hasComponent(world, RunSpoilsComponent, eid)) {
          RunSpoilsComponent.spoils[eid] = calculateRetainedLoot(RunSpoilsComponent.spoils[eid], 0.5);
        }
      }
    }

    return world;
  };
}