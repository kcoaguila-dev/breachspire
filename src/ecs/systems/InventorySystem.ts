import { IWorld, defineQuery } from "bitecs";
import {
  Position,
  PlayerControlled,
  InputStateComponent,
  CampCoreComponent,
  CampStockComponent,
  WildernessPoiComponent,
  PoiTypeValues,
} from "../components";

export interface InventoryUpgradeCost {
  woodCost: number;
  newMaxWood: number;
  newMaxIron: number;
}

export function computeInventoryUpgradeCost(currentLevel: number): InventoryUpgradeCost | null {
  // Level 0 (Base Pouch): maxWood = 20, maxIron = 10
  // Level 1 (Timber Stockpile): Cost = 10 Wood -> maxWood = 50, maxIron = 25
  // Level 2 (Reinforced Warehouse): Cost = 25 Wood -> maxWood = 120, maxIron = 60
  // Level 3 (Grand Royal Silo): Cost = 50 Wood -> maxWood = 300, maxIron = 150
  if (currentLevel === 0) {
    return { woodCost: 10, newMaxWood: 50, newMaxIron: 25 };
  } else if (currentLevel === 1) {
    return { woodCost: 25, newMaxWood: 120, newMaxIron: 60 };
  } else if (currentLevel === 2) {
    return { woodCost: 50, newMaxWood: 300, newMaxIron: 150 };
  }
  return null; // Max level reached
}

export function clampResource(current: number, added: number, max: number): number {
  return Math.min(max, current + added);
}

export function canAffordInventoryUpgrade(currentWood: number, cost: number): boolean {
  return currentWood >= cost;
}

const playerQuery = defineQuery([PlayerControlled, InputStateComponent, Position]);
const coreQuery = defineQuery([CampCoreComponent, CampStockComponent]);
const poiQuery = defineQuery([WildernessPoiComponent, Position]);

export function createInventorySystem() {
  const interactionCooldowns = new Map<number, number>();

  return (world: IWorld, delta: number): IWorld => {
    const players = playerQuery(world);
    const cores = coreQuery(world);
    const pois = poiQuery(world);

    if (cores.length === 0) return world;
    const coreEid = cores[0];

    // Decrement cooldowns
    for (const [pEid, cd] of interactionCooldowns.entries()) {
      if (cd > 0) {
        interactionCooldowns.set(pEid, cd - delta);
      }
    }

    for (let i = 0; i < players.length; i++) {
      const pEid = players[i];
      const cd = interactionCooldowns.get(pEid) || 0;

      if (InputStateComponent.attack[pEid] && cd <= 0) {
        for (let j = 0; j < pois.length; j++) {
          const poiEid = pois[j];
          if (WildernessPoiComponent.poiType[poiEid] !== PoiTypeValues.Warehouse) continue;

          const dx = Position.x[poiEid] - Position.x[pEid];
          const dy = Position.y[poiEid] - Position.y[pEid];
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= 65) {
            const currentLevel = CampStockComponent.inventoryLevel[coreEid] || 0;
            const upgradeCost = computeInventoryUpgradeCost(currentLevel);

            if (upgradeCost && canAffordInventoryUpgrade(CampStockComponent.wood[coreEid], upgradeCost.woodCost)) {
              interactionCooldowns.set(pEid, 300); // 300ms debounce
              CampStockComponent.wood[coreEid] -= upgradeCost.woodCost;
              CampStockComponent.inventoryLevel[coreEid] = currentLevel + 1;
              CampStockComponent.maxWood[coreEid] = upgradeCost.newMaxWood;
              CampStockComponent.maxIron[coreEid] = upgradeCost.newMaxIron;
              break;
            }
          }
        }
      }
    }

    return world;
  };
}
