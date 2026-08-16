import { defineQuery, hasComponent, IWorld } from "bitecs";
import {
  FSMState,
  Health,
  AlcoveNestComponent,
  CanReachElevated,
  FSMStateValues
} from "../components";

export function canEngageTarget(targetInAlcove: boolean, attackerCanFly: boolean): boolean {
  if (targetInAlcove && !attackerCanFly) {
    return false;
  }
  return true;
}

const fsmQuery = defineQuery([FSMState, Health]);

export function createNestTargetingSystem() {
  return (world: IWorld, _delta: number): IWorld => {
    const entities = fsmQuery(world);

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      if (Health.current[eid] <= 0) continue;

      const targetEid = FSMState.targetEntity[eid];
      if (targetEid === 0) continue; // No target

      // If the target has an alcove nest component, it's considered in an alcove
      const targetInAlcove = hasComponent(world, AlcoveNestComponent, targetEid);
      const attackerCanFly = hasComponent(world, CanReachElevated, eid);

      if (!canEngageTarget(targetInAlcove, attackerCanFly)) {
        // Clear the target if invalid
        FSMState.targetEntity[eid] = 0;
        FSMState.state[eid] = FSMStateValues.IDLE;
      }
    }

    return world;
  };
}
