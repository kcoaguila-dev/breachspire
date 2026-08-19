import { IWorld, defineQuery, addEntity, addComponent } from "bitecs";
import { Position, WildernessPoiComponent, UnitRole, RoleValues, CampCoreComponent, PlayerControlled, InputStateComponent, Velocity, Speed, FactionValues, FactionTag, Health, CombatTypeComponent, CombatTypeValues } from "../components";

export function canAffordRecruitment(energy: number, cost: number): boolean {
  return energy >= cost;
}

const poiQuery = defineQuery([WildernessPoiComponent, Position]);
const playerQuery = defineQuery([PlayerControlled, InputStateComponent, Position]);
const campCoreQuery = defineQuery([CampCoreComponent, Position]);
const peasantQuery = defineQuery([UnitRole, Position, Velocity, Speed]);

export function createRecruitmentSystem() {
  let vagrantRespawnTimer = 0;

  return (world: IWorld, delta: number) => {
    const players = playerQuery(world);
    const pois = poiQuery(world);
    const cores = campCoreQuery(world);
    const peasants = peasantQuery(world);

    if (cores.length === 0) return world;
    const coreEid = cores[0];
    const coreX = Position.x[coreEid] || 1600;
    const coreY = Position.y[coreEid] || 650;

    // 1. Periodic Vagrant Respawn at Vagrant Camps (POI Type 3)
    vagrantRespawnTimer += delta;
    if (vagrantRespawnTimer >= 30000) { // every 30s
      vagrantRespawnTimer = 0;
      for (let j = 0; j < pois.length; j++) {
        const poiEid = pois[j];
        if (WildernessPoiComponent.poiType[poiEid] === 3) {
          const px = Position.x[poiEid];
          let nearbyVagrants = 0;
          for (let k = 0; k < peasants.length; k++) {
            if (UnitRole.role[peasants[k]] === RoleValues.PEASANT && Math.abs(Position.x[peasants[k]] - px) < 100) {
              nearbyVagrants++;
            }
          }
          if (nearbyVagrants < 2) {
            const peasantEid = addEntity(world);
            addComponent(world, Position, peasantEid);
            Position.x[peasantEid] = px + (Math.random() * 40 - 20);
            Position.y[peasantEid] = Position.y[poiEid] || coreY;

            addComponent(world, Velocity, peasantEid);
            Velocity.x[peasantEid] = 0;
            Velocity.y[peasantEid] = 0;

            addComponent(world, Speed, peasantEid);
            Speed.value[peasantEid] = 40;

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
          }
        }
      }
    }

    // 2. Player Recruitment & Tool Stand Interaction
    for (let i = 0; i < players.length; i++) {
      const pEid = players[i];
      if (InputStateComponent.attack[pEid]) {
        for (let j = 0; j < pois.length; j++) {
          const poiEid = pois[j];
          const poiType = WildernessPoiComponent.poiType[poiEid];

          const dx = Position.x[poiEid] - Position.x[pEid];
          const dy = Position.y[poiEid] - Position.y[pEid];
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= 65) {
            let cost = 0;
            if (poiType === 3) cost = 5;       // Vagrant Camp -> Recruit Peasant
            else if (poiType === 4) cost = 10; // Hammer Stand -> Builder
            else if (poiType === 5) cost = 15; // Bow Stand -> Archer
            else if (poiType === 6) cost = 20; // Sword Stand -> Knight
            else continue;

            if (canAffordRecruitment(CampCoreComponent.lightEnergy[coreEid], cost)) {
              if (poiType === 3) {
                // Find nearest unrecruited vagrant sitting at the camp
                let targetVagrant = -1;
                let minVagrantDist = Infinity;
                for (let k = 0; k < peasants.length; k++) {
                  const peEid = peasants[k];
                  if (UnitRole.role[peEid] === RoleValues.PEASANT && Math.abs(Position.x[peEid] - coreX) > 300) {
                    const vdist = Math.abs(Position.x[peEid] - Position.x[poiEid]);
                    if (vdist < minVagrantDist) {
                      minVagrantDist = vdist;
                      targetVagrant = peEid;
                    }
                  }
                }

                if (targetVagrant !== -1) {
                  CampCoreComponent.lightEnergy[coreEid] -= cost;
                  // Recruited! Walk to camp core
                  Velocity.x[targetVagrant] = Math.sign(coreX - Position.x[targetVagrant]) * Speed.value[targetVagrant];
                } else {
                  // If none physically there, spawn a newly recruited one that walks home
                  CampCoreComponent.lightEnergy[coreEid] -= cost;
                  const peasantEid = addEntity(world);
                  addComponent(world, Position, peasantEid);
                  Position.x[peasantEid] = Position.x[poiEid];
                  Position.y[peasantEid] = Position.y[poiEid] || coreY;

                  addComponent(world, Velocity, peasantEid);
                  Velocity.x[peasantEid] = Math.sign(coreX - Position.x[poiEid]) * 40;
                  Velocity.y[peasantEid] = 0;

                  addComponent(world, Speed, peasantEid);
                  Speed.value[peasantEid] = 40;

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
                }
              } else {
                // Tool Stand: Assign job to nearest available unemployed peasant
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
                  CampCoreComponent.lightEnergy[coreEid] -= cost;
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
                }
              }
            }
          }
        }
      }
    }

    // 3. Unemployed Peasants wandering around Camp Core
    for (let k = 0; k < peasants.length; k++) {
      const peEid = peasants[k];
      if (UnitRole.role[peEid] === RoleValues.PEASANT) {
        const distToCore = Math.abs(Position.x[peEid] - coreX);
        if (distToCore < 150) {
          // Wander gently around town center
          if (Math.abs(Velocity.x[peEid]) < 1 && Math.random() < 0.02) {
            Velocity.x[peEid] = (Math.random() > 0.5 ? 1 : -1) * 20;
          } else if (Math.random() < 0.03) {
            Velocity.x[peEid] = 0;
          }
        } else if (Math.abs(Velocity.x[peEid]) < 1) {
          // If not near core and stopped, head toward core
          Velocity.x[peEid] = Math.sign(coreX - Position.x[peEid]) * Speed.value[peEid];
        }
      }
    }

    return world;
  };
}
