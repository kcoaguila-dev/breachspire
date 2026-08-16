import { IWorld, defineQuery, addEntity, addComponent } from "bitecs";
import { Position, WildernessPoiComponent, UnitRole, RoleValues, CampCoreComponent, PlayerControlled, InputStateComponent, Velocity, Speed, FactionValues, FactionTag, Health, CombatTypeComponent, CombatTypeValues } from "../components";

export function canAffordRecruitment(energy: number, cost: number): boolean {
  return energy >= cost;
}

const poiQuery = defineQuery([WildernessPoiComponent, Position]);
const playerQuery = defineQuery([PlayerControlled, InputStateComponent, Position]);
const campCoreQuery = defineQuery([CampCoreComponent]);
const peasantQuery = defineQuery([UnitRole, Position]);

export function createRecruitmentSystem() {
  return (world: IWorld, _delta: number) => {
    const players = playerQuery(world);
    const pois = poiQuery(world);
    const cores = campCoreQuery(world);
    const peasants = peasantQuery(world);

    if (cores.length === 0) return world;
    const coreEid = cores[0];

    for (let i = 0; i < players.length; i++) {
      const pEid = players[i];
      if (InputStateComponent.attack[pEid]) {
        for (let j = 0; j < pois.length; j++) {
          const poiEid = pois[j];
          const poiType = WildernessPoiComponent.poiType[poiEid];

          const dx = Position.x[poiEid] - Position.x[pEid];
          const dy = Position.y[poiEid] - Position.y[pEid];
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= 30) {
            let cost = 0;
            if (poiType === 3) cost = 5;       // Vagrant Camp -> Peasant
            else if (poiType === 4) cost = 10; // Hammer -> Builder
            else if (poiType === 5) cost = 15; // Bow -> Archer
            else if (poiType === 6) cost = 20; // Sword -> Knight
            else continue;

            if (canAffordRecruitment(CampCoreComponent.lightEnergy[coreEid], cost)) {
              CampCoreComponent.lightEnergy[coreEid] -= cost;

              if (poiType === 3) {
                // Spawn Peasant
                const peasantEid = addEntity(world);
                addComponent(world, Position, peasantEid);
                Position.x[peasantEid] = Position.x[poiEid];
                Position.y[peasantEid] = Position.y[poiEid];

                addComponent(world, Velocity, peasantEid);
                Velocity.x[peasantEid] = 0;
                Velocity.y[peasantEid] = 0;

                addComponent(world, Speed, peasantEid);
                Speed.value[peasantEid] = 30;

                addComponent(world, Health, peasantEid);
                Health.max[peasantEid] = 50;
                Health.current[peasantEid] = 50;

                addComponent(world, FactionTag, peasantEid);
                FactionTag.faction[peasantEid] = FactionValues.Hero;

                addComponent(world, UnitRole, peasantEid);
                UnitRole.role[peasantEid] = RoleValues.PEASANT;
                UnitRole.level[peasantEid] = 1;
                UnitRole.xp[peasantEid] = 0;
                UnitRole.nextLevelXp[peasantEid] = 50;
              } else {
                // Assign role to nearest peasant
                let targetPeasant = -1;
                let minDist = Infinity;
                for (let k = 0; k < peasants.length; k++) {
                  const peasantEid = peasants[k];
                  if (UnitRole.role[peasantEid] !== RoleValues.PEASANT) continue;

                  const pdx = Position.x[peasantEid] - Position.x[poiEid];
                  const pdist = Math.abs(pdx);
                  if (pdist < minDist) {
                    minDist = pdist;
                    targetPeasant = peasantEid;
                  }
                }

                if (targetPeasant !== -1) {
                  if (poiType === 4) {
                    UnitRole.role[targetPeasant] = RoleValues.BUILDER;
                  } else if (poiType === 5) {
                    UnitRole.role[targetPeasant] = RoleValues.ARCHER;
                    addComponent(world, CombatTypeComponent, targetPeasant);
                    CombatTypeComponent.type[targetPeasant] = CombatTypeValues.Ranged;
                  } else if (poiType === 6) {
                    UnitRole.role[targetPeasant] = RoleValues.KNIGHT;
                    addComponent(world, CombatTypeComponent, targetPeasant);
                    CombatTypeComponent.type[targetPeasant] = CombatTypeValues.Melee;
                  }
                } else {
                  // Refund if no peasant is available to pick it up?
                  // A real game might drop the tool on the ground. For now, we assume it's instantaneous if a peasant is near.
                  // If none, refund the cost.
                  CampCoreComponent.lightEnergy[coreEid] += cost;
                }
              }
            }
          }
        }
      }
    }

    return world;
  };
}
