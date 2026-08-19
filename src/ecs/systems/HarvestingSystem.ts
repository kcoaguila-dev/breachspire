import { IWorld, defineQuery } from "bitecs";
import {
  Position,
  HarvestableNode,
  HarvestableStateValues,
  UnitRole,
  RoleValues,
  PlayerControlled,
  InputStateComponent,
  CampCoreComponent,
  CampStockComponent,
  Velocity,
  Speed,
  Health,
  DayNightCycle
} from "../components";

export function computeHarvestProgress(currentProgress: number, builderSpeed: number, delta: number): number {
  return currentProgress + (builderSpeed * (delta / 1000));
}

export function canAffordTag(currentAether: number): boolean {
  return currentAether >= 2;
}

const nodeQuery = defineQuery([HarvestableNode, Position]);
const builderQuery = defineQuery([UnitRole, Position, Velocity, Speed, Health]);
const playerQuery = defineQuery([PlayerControlled, InputStateComponent, Position]);
const coreQuery = defineQuery([CampCoreComponent, CampStockComponent]);
const dayNightQuery = defineQuery([DayNightCycle]);

export function createHarvestingSystem() {
  const interactionCooldowns = new Map<number, number>();

  return (world: IWorld, delta: number): IWorld => {
    const nodes = nodeQuery(world);
    const builders = builderQuery(world);
    const players = playerQuery(world);
    const cores = coreQuery(world);
    const dayNights = dayNightQuery(world);

    if (cores.length === 0) return world;
    const coreEid = cores[0];

    let isNight = 0;
    if (dayNights.length > 0) {
      isNight = DayNightCycle.isNight[dayNights[0]];
    }

    // Decrement cooldowns
    for (const [pEid, cd] of interactionCooldowns.entries()) {
      if (cd > 0) {
        interactionCooldowns.set(pEid, cd - delta);
      }
    }

    // Player tagging
    for (let i = 0; i < players.length; i++) {
      const pEid = players[i];
      const cd = interactionCooldowns.get(pEid) || 0;

      if (InputStateComponent.attack[pEid] && cd <= 0) {
        for (let j = 0; j < nodes.length; j++) {
          const nodeEid = nodes[j];
          if (HarvestableNode.state[nodeEid] !== HarvestableStateValues.Natural) continue;

          const dx = Position.x[nodeEid] - Position.x[pEid];
          const dy = Position.y[nodeEid] - Position.y[pEid];
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= 65) {
            const currentAether = CampCoreComponent.lightEnergy[coreEid];
            if (canAffordTag(currentAether)) {
              interactionCooldowns.set(pEid, 300); // 300ms debounce
              CampCoreComponent.lightEnergy[coreEid] -= 2;
              HarvestableNode.state[nodeEid] = HarvestableStateValues.Ordered;
              break; // Prevent tagging multiple in one frame
            }
          }
        }
      }
    }

    // Builders harvesting (only during day)
    for (let i = 0; i < builders.length; i++) {
      const builderEid = builders[i];
      if (Health.current[builderEid] <= 0) continue; // Dead entity guard
      if (UnitRole.role[builderEid] !== RoleValues.BUILDER) continue;

      UnitRole.isConstructing[builderEid] = 0;

      let targetNodeEid = -1;
      let minDist = Infinity;

      // Find closest ordered or being harvested node
      for (let j = 0; j < nodes.length; j++) {
        const nodeEid = nodes[j];
        const state = HarvestableNode.state[nodeEid];
        if (state === HarvestableStateValues.Ordered || state === HarvestableStateValues.BeingHarvested) {
          const dx = Position.x[nodeEid] - Position.x[builderEid];
          const dist = Math.abs(dx);
          if (dist < minDist) {
            minDist = dist;
            targetNodeEid = nodeEid;
          }
        }
      }

      // If we found a node and it's day, builder goes to harvest
      if (targetNodeEid !== -1 && isNight === 0) {
        const dx = Position.x[targetNodeEid] - Position.x[builderEid];
        const dist = Math.abs(dx);

        if (dist > 30) {
          Velocity.x[builderEid] = Math.sign(dx) * Speed.value[builderEid];
        } else {
          Velocity.x[builderEid] = 0;
          HarvestableNode.state[targetNodeEid] = HarvestableStateValues.BeingHarvested;
          UnitRole.isConstructing[builderEid] = 1; // Emit dust, builder chopping anim

          const speedMultiplier = UnitRole.level[builderEid] >= 2 ? 2.0 : 1.0;
          HarvestableNode.progress[targetNodeEid] = computeHarvestProgress(
            HarvestableNode.progress[targetNodeEid],
            20 * speedMultiplier,
            delta
          );

          if (HarvestableNode.progress[targetNodeEid] >= 100) {
            HarvestableNode.state[targetNodeEid] = HarvestableStateValues.Depleted;
            const nodeType = HarvestableNode.nodeType[targetNodeEid];
            const yieldCount = HarvestableNode.yieldCount[targetNodeEid];

            if (nodeType === 0) { // PineTree -> Wood
               CampStockComponent.wood[coreEid] += yieldCount;
            } else if (nodeType === 1) { // IronOre -> Iron
               CampStockComponent.iron[coreEid] += yieldCount;
            }
          }
        }
      }
    }

    return world;
  };
}
