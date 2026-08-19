import { defineQuery, IWorld, hasComponent } from "bitecs";
import {
  Position,
  UnitRole,
  RoleValues,
  WatchtowerComponent,
  TowerStateValues,
  TowerTierValues,
  Health,
  Speed,
  Velocity,
  PlayerControlled,
  InputStateComponent,
  CampCoreComponent,
  CampStockComponent
} from "../components";

// ─────────────────────────────────────────────────────
// EXPORTED PURE LOGIC — testable by Vitest
// ─────────────────────────────────────────────────────

export interface TowerUpgradeCost {
  aether: number;
  wood: number;
  iron: number;
  nextTier: number;
  nextMaxGarrison: number;
  height: number;
}

export function computeTowerUpgradeCost(currentTier: number): TowerUpgradeCost | null {
  if (currentTier === TowerTierValues.RUBBLE) {
    // Rubble Debris -> Level 1 Wooden Watchtower (64x120 px, 1 Archer)
    return { aether: 5, wood: 10, iron: 0, nextTier: TowerTierValues.WOODEN, nextMaxGarrison: 1, height: 120 };
  } else if (currentTier === TowerTierValues.WOODEN) {
    // Level 1 -> Level 2 Timber Bastion (80x160 px, 2 Archers)
    return { aether: 10, wood: 25, iron: 0, nextTier: TowerTierValues.BASTION, nextMaxGarrison: 2, height: 160 };
  } else if (currentTier === TowerTierValues.BASTION) {
    // Level 2 -> Level 3 Stone Fortress Tower (96x200 px, 3 Archers)
    return { aether: 15, wood: 50, iron: 15, nextTier: TowerTierValues.FORTRESS, nextMaxGarrison: 3, height: 200 };
  }
  return null; // Max tier reached
}

export function computeTowerPerchHeight(tier: number): number {
  if (tier === TowerTierValues.FORTRESS) return 175; // 200px tower
  if (tier === TowerTierValues.BASTION) return 135;  // 160px tower
  if (tier === TowerTierValues.WOODEN) return 95;   // 120px tower
  return 0;
}

export function computeWatchtowerRange(baseRange: number, isStationedInTower: boolean): number {
  if (isStationedInTower) {
    return baseRange * 1.5; // +50% elevated vantage range
  }
  return baseRange;
}

export function computeWatchtowerAttackCooldown(baseCooldown: number, isStationedInTower: boolean): number {
  if (isStationedInTower) {
    return baseCooldown * 0.7; // +30% attack speed
  }
  return baseCooldown;
}

export function canGarrisonTower(currentGarrison: number, maxGarrison: number): boolean {
  return currentGarrison < maxGarrison;
}

export function canOccupyWatchtower(occupiedArcherEid: number): boolean {
  return !occupiedArcherEid || occupiedArcherEid <= 0;
}

// ─────────────────────────────────────────────────────
// SYSTEM FACTORY
// ─────────────────────────────────────────────────────

const towerQuery = defineQuery([WatchtowerComponent, Position]);
const unitQuery = defineQuery([UnitRole, Position, Health]);
const playerQuery = defineQuery([PlayerControlled, InputStateComponent, Position]);
const coreQuery = defineQuery([CampCoreComponent]);

export function createWatchtowerSystem() {
  const interactionCooldowns = new Map<number, number>();

  return (world: IWorld, delta: number): IWorld => {
    const towers = towerQuery(world);
    const units = unitQuery(world);
    const players = playerQuery(world);
    const cores = coreQuery(world);

    if (cores.length === 0) return world;
    const coreEid = cores[0];

    // Decrement interaction cooldowns
    for (const [pEid, cd] of interactionCooldowns.entries()) {
      if (cd > 0) {
        interactionCooldowns.set(pEid, cd - delta);
      }
    }

    // 1. Player Interaction with Watchtowers (Build, Upgrade, or Assign Archer)
    for (let p = 0; p < players.length; p++) {
      const pEid = players[p];
      const cd = interactionCooldowns.get(pEid) || 0;

      if (InputStateComponent.attack[pEid] && cd <= 0) {
        const px = Position.x[pEid];

        for (let t = 0; t < towers.length; t++) {
          const tEid = towers[t];
          const dist = Math.abs(Position.x[tEid] - px);

          if (dist <= 65) {
            const state = WatchtowerComponent.state[tEid];
            const tier = WatchtowerComponent.tier[tEid];
            const garrison = WatchtowerComponent.garrisonCount[tEid];
            const maxG = WatchtowerComponent.maxGarrison[tEid];

            // Case A: Unbuilt Foundation Rubble -> Order Construction
            if (state === TowerStateValues.RUBBLE) {
              const cost = computeTowerUpgradeCost(0)!;
              const pEnergy = PlayerControlled.energy[pEid] || 0;
              const cEnergy = CampCoreComponent.lightEnergy[coreEid] || 0;
              const curAether = Math.max(pEnergy, cEnergy);
              const curWood = hasComponent(world, CampStockComponent, coreEid) ? CampStockComponent.wood[coreEid] : 0;

              if (curAether >= cost.aether && curWood >= cost.wood) {
                interactionCooldowns.set(pEid, 300);
                if (PlayerControlled.energy[pEid] >= cost.aether) {
                  PlayerControlled.energy[pEid] -= cost.aether;
                }
                if (CampCoreComponent.lightEnergy[coreEid] >= cost.aether) {
                  CampCoreComponent.lightEnergy[coreEid] -= cost.aether;
                }
                if (hasComponent(world, CampStockComponent, coreEid)) {
                  CampStockComponent.wood[coreEid] -= cost.wood;
                }
                WatchtowerComponent.state[tEid] = TowerStateValues.ORDERED;
                WatchtowerComponent.progress[tEid] = 0;
                break;
              }
            }

            // Case B: Completed Tower with Free Garrison Slot -> Station nearest available Archer
            else if (state === TowerStateValues.COMPLETED && garrison < maxG) {
              // Find nearest available unassigned archer
              let targetArcher = -1;
              let minADist = Infinity;

              for (let u = 0; u < units.length; u++) {
                const uEid = units[u];
                if (Health.current[uEid] <= 0) continue;
                if (UnitRole.role[uEid] !== RoleValues.ARCHER) continue;

                // Check if already stationed in a tower
                let isStationed = false;
                for (let ot = 0; ot < towers.length; ot++) {
                  const otEid = towers[ot];
                  if (
                    WatchtowerComponent.archer1Eid[otEid] === uEid ||
                    WatchtowerComponent.archer2Eid[otEid] === uEid ||
                    WatchtowerComponent.archer3Eid[otEid] === uEid ||
                    WatchtowerComponent.occupiedArcherEid[otEid] === uEid
                  ) {
                    isStationed = true;
                    break;
                  }
                }
                if (isStationed) continue;

                const adist = Math.abs(Position.x[uEid] - Position.x[tEid]);
                if (adist < minADist) {
                  minADist = adist;
                  targetArcher = uEid;
                }
              }

              if (targetArcher !== -1) {
                interactionCooldowns.set(pEid, 300);
                // Assign to first empty slot
                if (WatchtowerComponent.archer1Eid[tEid] === 0) {
                  WatchtowerComponent.archer1Eid[tEid] = targetArcher;
                  WatchtowerComponent.occupiedArcherEid[tEid] = targetArcher; // legacy
                } else if (WatchtowerComponent.archer2Eid[tEid] === 0) {
                  WatchtowerComponent.archer2Eid[tEid] = targetArcher;
                } else if (WatchtowerComponent.archer3Eid[tEid] === 0) {
                  WatchtowerComponent.archer3Eid[tEid] = targetArcher;
                }
                WatchtowerComponent.garrisonCount[tEid]++;
                break;
              }
            }

            // Case C: Fully Garrisoned Completed Tower -> Upgrade to next tier
            else if (state === TowerStateValues.COMPLETED && garrison >= maxG) {
              const cost = computeTowerUpgradeCost(tier);
              if (cost) {
                const pEnergy = PlayerControlled.energy[pEid] || 0;
                const cEnergy = CampCoreComponent.lightEnergy[coreEid] || 0;
                const curAether = Math.max(pEnergy, cEnergy);
                const curWood = hasComponent(world, CampStockComponent, coreEid) ? CampStockComponent.wood[coreEid] : 0;
                const curIron = hasComponent(world, CampStockComponent, coreEid) ? CampStockComponent.iron[coreEid] : 0;

                if (curAether >= cost.aether && curWood >= cost.wood && curIron >= cost.iron) {
                  interactionCooldowns.set(pEid, 300);
                  if (PlayerControlled.energy[pEid] >= cost.aether) {
                    PlayerControlled.energy[pEid] -= cost.aether;
                  }
                  if (CampCoreComponent.lightEnergy[coreEid] >= cost.aether) {
                    CampCoreComponent.lightEnergy[coreEid] -= cost.aether;
                  }
                  if (hasComponent(world, CampStockComponent, coreEid)) {
                    CampStockComponent.wood[coreEid] -= cost.wood;
                    CampStockComponent.iron[coreEid] -= cost.iron;
                  }
                  WatchtowerComponent.state[tEid] = TowerStateValues.ORDERED;
                  WatchtowerComponent.progress[tEid] = 0;
                  break;
                }
              }
            }
          }
        }
      }
    }

    // 2. Builder Construction for Ordered Towers
    for (let t = 0; t < towers.length; t++) {
      const tEid = towers[t];
      const state = WatchtowerComponent.state[tEid];

      if (state === TowerStateValues.ORDERED || state === TowerStateValues.BUILDING) {
        const tx = Position.x[tEid];

        // Find closest builder to work on this tower
        let closestBuilder = -1;
        let minBDist = Infinity;

        for (let u = 0; u < units.length; u++) {
          const uEid = units[u];
          if (Health.current[uEid] <= 0) continue;
          if (UnitRole.role[uEid] !== RoleValues.BUILDER) continue;

          const bdist = Math.abs(Position.x[uEid] - tx);
          if (bdist < minBDist) {
            minBDist = bdist;
            closestBuilder = uEid;
          }
        }

        if (closestBuilder !== -1) {
          const bdist = Math.abs(Position.x[closestBuilder] - tx);

          if (bdist > 25) {
            // Builder runs to tower
            Velocity.x[closestBuilder] = Math.sign(tx - Position.x[closestBuilder]) * Speed.value[closestBuilder];
            UnitRole.isConstructing[closestBuilder] = 0;
          } else {
            // Builder is at tower site hammering!
            Velocity.x[closestBuilder] = 0;
            UnitRole.isConstructing[closestBuilder] = 1;
            WatchtowerComponent.state[tEid] = TowerStateValues.BUILDING;

            // Increment construction progress
            WatchtowerComponent.progress[tEid] += 25 * (delta / 1000); // 4 seconds total build time

            if (WatchtowerComponent.progress[tEid] >= 100) {
              const currentTier = WatchtowerComponent.tier[tEid];
              const cost = computeTowerUpgradeCost(currentTier);
              const nextTier = cost ? cost.nextTier : currentTier + 1;
              const nextMaxG = cost ? cost.nextMaxGarrison : Math.min(3, currentTier + 1);

              WatchtowerComponent.tier[tEid] = nextTier;
              WatchtowerComponent.state[tEid] = TowerStateValues.COMPLETED;
              WatchtowerComponent.progress[tEid] = 100;
              WatchtowerComponent.maxGarrison[tEid] = nextMaxG;
              WatchtowerComponent.level[tEid] = nextTier;
              UnitRole.isConstructing[closestBuilder] = 0;
            }
          }
        }
      }
    }

    // 3. Garrison Maintenance & Elevation
    for (let t = 0; t < towers.length; t++) {
      const tEid = towers[t];
      const state = WatchtowerComponent.state[tEid];
      const tier = WatchtowerComponent.tier[tEid];

      if (state === TowerStateValues.COMPLETED) {
        const perchY = (Position.y[tEid] || 650) - computeTowerPerchHeight(tier);
        const tx = Position.x[tEid];

        const slots = [
          { key: 'archer1Eid', offset: tier > 1 ? -12 : 0 },
          { key: 'archer2Eid', offset: 12 },
          { key: 'archer3Eid', offset: 0 }
        ];

        let activeCount = 0;

        for (let s = 0; s < slots.length; s++) {
          const slotKey = slots[s].key as 'archer1Eid' | 'archer2Eid' | 'archer3Eid';
          const aEid = WatchtowerComponent[slotKey][tEid];

          if (aEid > 0) {
            if (!hasComponent(world, Health, aEid) || Health.current[aEid] <= 0) {
              WatchtowerComponent[slotKey][tEid] = 0;
              if (slotKey === 'archer1Eid') WatchtowerComponent.occupiedArcherEid[tEid] = 0;
            } else {
              activeCount++;
              // Lock Archer atop tower perch with elevated advantage
              Position.x[aEid] = tx + slots[s].offset;
              Position.y[aEid] = perchY;
              Velocity.x[aEid] = 0;
              Velocity.y[aEid] = 0;
            }
          }
        }

        WatchtowerComponent.garrisonCount[tEid] = activeCount;
      }
    }

    return world;
  };
}
