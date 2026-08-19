import { IWorld, defineQuery, addComponent, removeComponent, hasComponent } from "bitecs";
import { Position, WallBlueprint, BlueprintStateValues, UnitRole, RoleValues, CampCoreComponent, CampStockComponent, PlayerControlled, InputStateComponent, Velocity, Speed, CampWallComponent, Health, WallTierValues } from "../components";

export interface WallUpgradeCost {
  aether: number;
  wood: number;
  iron: number;
  hp: number;
}

export function computeWallUpgradeCost(currentTier: number): WallUpgradeCost | null {
  if (currentTier === 0) {
    // Initial construction from mound -> Tier 1 (Wooden Palisade)
    return { aether: 5, wood: 0, iron: 0, hp: 60 };
  } else if (currentTier === 1) {
    // Upgrade Tier 1 (Wood) -> Tier 2 (Stone Wall)
    return { aether: 10, wood: 5, iron: 2, hp: 120 };
  } else if (currentTier === 2) {
    // Upgrade Tier 2 (Stone) -> Tier 3 (Iron Spiked Rampart)
    return { aether: 15, wood: 0, iron: 5, hp: 200 };
  }
  return null; // Max tier reached
}

export function calculateThornsDamage(wallTier: number, damageReceived: number): number {
  if (wallTier >= WallTierValues.IronSpikes && damageReceived > 0) {
    return 10;
  }
  return 0;
}

export function computeConstructionProgress(currentProgress: number, builderSpeed: number, delta: number): number {
  return currentProgress + (builderSpeed * (delta / 1000));
}

export function computeRepairAmount(builderSpeed: number, delta: number): number {
  return builderSpeed * (delta / 1000);
}

const blueprintQuery = defineQuery([WallBlueprint, Position]);
const builderQuery = defineQuery([UnitRole, Position, Velocity, Speed]);
const playerQuery = defineQuery([PlayerControlled, InputStateComponent, Position]);
const campCoreQuery = defineQuery([CampCoreComponent]);
const campWallQuery = defineQuery([CampWallComponent, Position]);

export function createBuildingSystem() {
  const interactionCooldowns = new Map<number, number>();

  return (world: IWorld, delta: number) => {
    const blueprints = blueprintQuery(world);
    const builders = builderQuery(world);
    const players = playerQuery(world);
    const cores = campCoreQuery(world);

    if (cores.length === 0) return world;
    const coreEid = cores[0];

    // Decrement interaction cooldowns
    for (const [pEid, cd] of interactionCooldowns.entries()) {
      if (cd > 0) {
        interactionCooldowns.set(pEid, cd - delta);
      }
    }

    const walls = campWallQuery(world);

    // Player interaction with blueprints and built walls
    for (let i = 0; i < players.length; i++) {
      const pEid = players[i];
      const cd = interactionCooldowns.get(pEid) || 0;

      if (InputStateComponent.attack[pEid] && cd <= 0) {
        let interacted = false;

        // 1. Check unbuilt foundation mounds
        for (let j = 0; j < blueprints.length; j++) {
          const bpEid = blueprints[j];
          if (WallBlueprint.state[bpEid] !== BlueprintStateValues.MOUND) continue;

          const dx = Position.x[bpEid] - Position.x[pEid];
          const dy = Position.y[bpEid] - Position.y[pEid];
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= 65) {
            const cost = computeWallUpgradeCost(0)!;
            const curAether = CampCoreComponent.lightEnergy[coreEid];
            const curWood = hasComponent(world, CampStockComponent, coreEid) ? CampStockComponent.wood[coreEid] : 0;

            if (curAether >= cost.aether && curWood >= cost.wood) {
              interactionCooldowns.set(pEid, 300); // 300ms debounce
              CampCoreComponent.lightEnergy[coreEid] -= cost.aether;
              if (hasComponent(world, CampStockComponent, coreEid)) {
                CampStockComponent.wood[coreEid] -= cost.wood;
              }
              WallBlueprint.state[bpEid] = BlueprintStateValues.ORDERED;
              WallBlueprint.targetTier[bpEid] = WallTierValues.PalisadeWood;
              interacted = true;
              break;
            }
          }
        }

        // 2. Check upgrading existing built walls
        if (!interacted) {
          for (let j = 0; j < walls.length; j++) {
            const wallEid = walls[j];
            if (hasComponent(world, WallBlueprint, wallEid)) continue; // Already being upgraded

            const dx = Position.x[wallEid] - Position.x[pEid];
            const dy = Position.y[wallEid] - Position.y[pEid];
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= 65) {
              const currentTier = CampWallComponent.tier[wallEid] || WallTierValues.PalisadeWood;
              const nextTierCost = computeWallUpgradeCost(currentTier);

              if (nextTierCost) {
                const curAether = CampCoreComponent.lightEnergy[coreEid];
                const curWood = hasComponent(world, CampStockComponent, coreEid) ? CampStockComponent.wood[coreEid] : 0;
                const curIron = hasComponent(world, CampStockComponent, coreEid) ? CampStockComponent.iron[coreEid] : 0;

                if (curAether >= nextTierCost.aether && curWood >= nextTierCost.wood && curIron >= nextTierCost.iron) {
                  interactionCooldowns.set(pEid, 300);
                  CampCoreComponent.lightEnergy[coreEid] -= nextTierCost.aether;
                  if (hasComponent(world, CampStockComponent, coreEid)) {
                    CampStockComponent.wood[coreEid] -= nextTierCost.wood;
                    CampStockComponent.iron[coreEid] -= nextTierCost.iron;
                  }

                  addComponent(world, WallBlueprint, wallEid);
                  WallBlueprint.state[wallEid] = BlueprintStateValues.ORDERED;
                  WallBlueprint.targetTier[wallEid] = currentTier + 1;
                  WallBlueprint.progress[wallEid] = 0;
                  WallBlueprint.targetWallEid[wallEid] = wallEid;
                  break;
                }
              }
            }
          }
        }
      }
    }

    // Builders constructing or repairing
    for (let i = 0; i < builders.length; i++) {
      const builderEid = builders[i];
      if (UnitRole.role[builderEid] !== RoleValues.BUILDER) continue;

      UnitRole.isConstructing[builderEid] = 0;

      let targetBpEid = -1;
      let targetWallEid = -1;
      let minDist = Infinity;

      // 1. Look for blueprints first
      for (let j = 0; j < blueprints.length; j++) {
        const bpEid = blueprints[j];
        if (WallBlueprint.state[bpEid] === BlueprintStateValues.ORDERED || WallBlueprint.state[bpEid] === BlueprintStateValues.BUILDING) {
          const dx = Position.x[bpEid] - Position.x[builderEid];
          const dist = Math.abs(dx);
          if (dist < minDist) {
            minDist = dist;
            targetBpEid = bpEid;
          }
        }
      }

      // 2. If no blueprints, look for damaged walls to repair
      if (targetBpEid === -1) {
        for (let j = 0; j < walls.length; j++) {
          const wallEid = walls[j];
          if (CampWallComponent.hp[wallEid] < CampWallComponent.maxHp[wallEid] && CampWallComponent.hp[wallEid] > 0) {
            const dx = Position.x[wallEid] - Position.x[builderEid];
            const dist = Math.abs(dx);
            if (dist < minDist) {
              minDist = dist;
              targetWallEid = wallEid;
            }
          }
        }
      }

      if (targetBpEid !== -1 && hasComponent(world, WallBlueprint, targetBpEid)) {
        const dx = Position.x[targetBpEid] - Position.x[builderEid];
        const dist = Math.abs(dx);

        if (dist > 30) {
          Velocity.x[builderEid] = Math.sign(dx) * Speed.value[builderEid];
        } else {
          Velocity.x[builderEid] = 0;
          WallBlueprint.state[targetBpEid] = BlueprintStateValues.BUILDING;
          UnitRole.isConstructing[builderEid] = 1; // Emit dust

          // Build speed multiplier based on builder level
          const speedMultiplier = UnitRole.level[builderEid] >= 2 ? 2.0 : 1.0;

          WallBlueprint.progress[targetBpEid] = computeConstructionProgress(
            WallBlueprint.progress[targetBpEid],
            20 * speedMultiplier,
            delta
          );

          // Add XP for building
          UnitRole.xp[builderEid] += 1 * (delta / 1000);

          if (WallBlueprint.progress[targetBpEid] >= 100) {
            WallBlueprint.state[targetBpEid] = BlueprintStateValues.COMPLETED;

            const targetTier = WallBlueprint.targetTier[targetBpEid] || WallTierValues.PalisadeWood;
            let wallHp = targetTier === WallTierValues.IronSpikes ? 200 : (targetTier === WallTierValues.MasonryStone ? 120 : 60);
            if (UnitRole.level[builderEid] >= 2) {
              wallHp += 30; // Builder level perk
            }

            if (!hasComponent(world, CampWallComponent, targetBpEid)) {
              addComponent(world, CampWallComponent, targetBpEid);
            }
            CampWallComponent.tier[targetBpEid] = targetTier;
            CampWallComponent.hp[targetBpEid] = wallHp;
            CampWallComponent.maxHp[targetBpEid] = wallHp;

            if (!hasComponent(world, Health, targetBpEid)) {
              addComponent(world, Health, targetBpEid);
            }
            Health.current[targetBpEid] = wallHp;
            Health.max[targetBpEid] = wallHp;

            // Cleanly remove WallBlueprint so builder doesn't re-target it
            removeComponent(world, WallBlueprint, targetBpEid);

            // XP burst on completion
            UnitRole.xp[builderEid] += 10;
          }
        }
      } else if (targetWallEid !== -1 && hasComponent(world, CampWallComponent, targetWallEid)) {
        const dx = Position.x[targetWallEid] - Position.x[builderEid];
        const dist = Math.abs(dx);

        if (dist > 30) {
          Velocity.x[builderEid] = Math.sign(dx) * Speed.value[builderEid];
        } else {
          Velocity.x[builderEid] = 0;
          UnitRole.isConstructing[builderEid] = 1; // Emit dust

          const speedMultiplier = UnitRole.level[builderEid] >= 2 ? 2.0 : 1.0;
          const repairAmount = computeRepairAmount(20 * speedMultiplier, delta);

          CampWallComponent.hp[targetWallEid] += repairAmount;
          if (CampWallComponent.hp[targetWallEid] > CampWallComponent.maxHp[targetWallEid]) {
            CampWallComponent.hp[targetWallEid] = CampWallComponent.maxHp[targetWallEid];
          }

          if (hasComponent(world, Health, targetWallEid)) {
            Health.current[targetWallEid] = CampWallComponent.hp[targetWallEid];
          }

          UnitRole.xp[builderEid] += 1 * (delta / 1000);
        }
      } else {
         Velocity.x[builderEid] = 0;
      }
    }

    return world;
  };
}
