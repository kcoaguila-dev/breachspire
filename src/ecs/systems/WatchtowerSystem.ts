import { defineQuery, IWorld, hasComponent } from "bitecs";
import { Position, UnitRole, RoleValues, WatchtowerComponent, Health, Speed } from "../components";

export function computeWatchtowerRange(baseRange: number, isStationedInTower: boolean): number {
  if (isStationedInTower) {
    return baseRange * 1.5; // +50% range bonus
  }
  return baseRange;
}

export function computeWatchtowerAttackCooldown(baseCooldown: number, isStationedInTower: boolean): number {
  if (isStationedInTower) {
    return baseCooldown * 0.7; // +30% attack speed (30% shorter cooldown)
  }
  return baseCooldown;
}

export function canOccupyWatchtower(occupiedArcherEid: number): boolean {
  return !occupiedArcherEid || occupiedArcherEid <= 0;
}

const towerQuery = defineQuery([WatchtowerComponent, Position]);
const archerQuery = defineQuery([UnitRole, Position, Health, Speed]);

export function createWatchtowerSystem() {
  return (world: IWorld, _delta: number): IWorld => {
    const towers = towerQuery(world);
    const units = archerQuery(world);

    for (let i = 0; i < towers.length; i++) {
      const towerEid = towers[i];
      let occupiedEid = WatchtowerComponent.occupiedArcherEid[towerEid];

      // Check if current occupant died
      if (occupiedEid > 0) {
        if (!hasComponent(world, Health, occupiedEid) || Health.current[occupiedEid] <= 0) {
          WatchtowerComponent.occupiedArcherEid[towerEid] = 0;
          occupiedEid = 0;
        }
      }

      // If vacant, find closest available Archer
      if (canOccupyWatchtower(occupiedEid)) {
        let closestArcherEid = -1;
        let minDist = 300; // 300px recruitment radius

        for (let j = 0; j < units.length; j++) {
          const archerEid = units[j];
          if (Health.current[archerEid] <= 0) continue;
          if (UnitRole.role[archerEid] !== RoleValues.ARCHER) continue;

          // Check if archer is already in another tower
          let alreadyOccupies = false;
          for (let t = 0; t < towers.length; t++) {
            if (WatchtowerComponent.occupiedArcherEid[towers[t]] === archerEid) {
              alreadyOccupies = true;
              break;
            }
          }
          if (alreadyOccupies) continue;

          const dx = Position.x[archerEid] - Position.x[towerEid];
          const dist = Math.abs(dx);
          if (dist < minDist) {
            minDist = dist;
            closestArcherEid = archerEid;
          }
        }

        if (closestArcherEid !== -1) {
          WatchtowerComponent.occupiedArcherEid[towerEid] = closestArcherEid;
          // Station archer onto tower perch
          Position.x[closestArcherEid] = Position.x[towerEid];
          Position.y[closestArcherEid] = Position.y[towerEid] - 40; // Perch atop tower
        }
      }
    }

    return world;
  };
}
