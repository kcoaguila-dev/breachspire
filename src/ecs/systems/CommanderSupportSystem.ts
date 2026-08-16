import { defineQuery, IWorld, hasComponent } from "bitecs";
import {
  CommanderTag,
  CampCoreComponent,
  SupportRequestComponent,
  CampWallComponent,
  SupportActionEnum,
  Health,
  Speed
} from "../components";

// ─────────────────────────────────────────────────────
// EXPORTED PURE LOGIC — testable by Vitest without Phaser or world
// ─────────────────────────────────────────────────────
export function canAffordSupportAction(currentEnergy: number, actionCost: number): boolean {
  return currentEnergy >= actionCost;
}

export function calculateRepairAmount(currentWallHp: number, maxWallHp: number, repairPower: number): number {
  return Math.min(maxWallHp, currentWallHp + repairPower) - currentWallHp;
}

// ─────────────────────────────────────────────────────
// SYSTEM FACTORY
// ─────────────────────────────────────────────────────
const commanderQuery = defineQuery([CommanderTag, SupportRequestComponent]);
const campCoreQuery = defineQuery([CampCoreComponent]);

export function createCommanderSupportSystem() {
  // Hardcoded costs/power for now based on spec (Rally Flag, Wall Repair, Aether Surge)
  const COSTS = {
    [SupportActionEnum.RallyFlag]: 50,
    [SupportActionEnum.RepairWall]: 75,
    [SupportActionEnum.AetherSurge]: 100,
  };

  const REPAIR_POWER = 500;
  const RALLY_SPEED_BOOST = 50;

  return (world: IWorld, _delta: number): IWorld => {
    const commanders = commanderQuery(world);
    if (commanders.length === 0) return world;

    const cores = campCoreQuery(world);
    if (cores.length === 0) return world;

    const coreEid = cores[0];

    for (let i = 0; i < commanders.length; i++) {
      const eid = commanders[i];
      if (SupportRequestComponent.requested[eid] === 1) {
        const actionType = SupportRequestComponent.actionType[eid];
        const cost = COSTS[actionType as SupportActionEnum];

        const currentEnergy = CampCoreComponent.lightEnergy[coreEid];

        if (canAffordSupportAction(currentEnergy, cost)) {
           // Deduct energy
           CampCoreComponent.lightEnergy[coreEid] -= cost;

           const targetEid = SupportRequestComponent.targetEid[eid];

           if (actionType === SupportActionEnum.RepairWall) {
             if (hasComponent(world, CampWallComponent, targetEid) && hasComponent(world, Health, targetEid)) {
               const healAmount = calculateRepairAmount(Health.current[targetEid], Health.max[targetEid], REPAIR_POWER);
               Health.current[targetEid] += healAmount;
             }
           } else if (actionType === SupportActionEnum.RallyFlag) {
             if (hasComponent(world, Speed, targetEid)) {
                Speed.value[targetEid] += RALLY_SPEED_BOOST;
             }
           }

           // Clear request
           SupportRequestComponent.requested[eid] = 0;
        }
      }
    }

    return world;
  };
}