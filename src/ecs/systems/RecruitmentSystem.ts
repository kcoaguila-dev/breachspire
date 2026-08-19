import { IWorld, defineQuery, addComponent } from "bitecs";
import { Position, WildernessPoiComponent, UnitRole, RoleValues, CampCoreComponent, PlayerControlled, InputStateComponent, Velocity, Speed, Health, CombatTypeComponent, CombatTypeValues, Attack, FSMState, FSMStateValues } from "../components";

export function canAffordRecruitment(energy: number, cost: number): boolean {
  return energy >= cost;
}

const poiQuery = defineQuery([WildernessPoiComponent, Position]);
const playerQuery = defineQuery([PlayerControlled, InputStateComponent, Position]);
const campCoreQuery = defineQuery([CampCoreComponent, Position]);
const peasantQuery = defineQuery([UnitRole, Position, Velocity, Speed]);

export function createRecruitmentSystem() {
  const interactionCooldowns = new Map<number, number>();

  return (world: IWorld, delta: number) => {
    const players = playerQuery(world);
    const pois = poiQuery(world);
    const cores = campCoreQuery(world);
    const peasants = peasantQuery(world);

    if (cores.length === 0) return world;
    const coreEid = cores[0];
    const coreX = Position.x[coreEid] || 1600;

    // Decrement interaction cooldowns
    for (const [pEid, cd] of interactionCooldowns.entries()) {
      if (cd > 0) {
        interactionCooldowns.set(pEid, cd - delta);
      }
    }

    // Player Recruitment & Tool Stand Interaction
    for (let i = 0; i < players.length; i++) {
      const pEid = players[i];
      const cd = interactionCooldowns.get(pEid) || 0;

      if (InputStateComponent.attack[pEid] && cd <= 0) {
        for (let j = 0; j < pois.length; j++) {
          const poiEid = pois[j];
          const poiType = WildernessPoiComponent.poiType[poiEid];

          const dx = Position.x[poiEid] - Position.x[pEid];
          const dy = Position.y[poiEid] - Position.y[pEid];
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= 65) {
            let cost = 0;
            if (poiType === 3) cost = 5;       // Waygate Portal -> Guide Vagrant to Camp Core
            else if (poiType === 4) cost = 10; // Hammer Stand -> Builder
            else if (poiType === 5) cost = 15; // Bow Stand -> Archer
            else if (poiType === 6) cost = 20; // Sword Stand -> Knight
            else continue;

            const pEnergy = PlayerControlled.energy[pEid] || 0;
            const cEnergy = CampCoreComponent.lightEnergy[coreEid] || 0;
            const availableEnergy = Math.max(pEnergy, cEnergy);

            if (canAffordRecruitment(availableEnergy, cost)) {
              if (poiType === 3) {
                // Find nearest unrecruited vagrant sitting at the portal
                let targetVagrant = -1;
                let minVagrantDist = Infinity;
                for (let k = 0; k < peasants.length; k++) {
                  const peEid = peasants[k];
                  if (UnitRole.role[peEid] === RoleValues.VAGRANT) {
                    const vdist = Math.abs(Position.x[peEid] - Position.x[poiEid]);
                    if (vdist < 120 && vdist < minVagrantDist) {
                      minVagrantDist = vdist;
                      targetVagrant = peEid;
                    }
                  }
                }

                if (targetVagrant !== -1) {
                  interactionCooldowns.set(pEid, 300);
                  if (PlayerControlled.energy[pEid] >= cost) {
                    PlayerControlled.energy[pEid] -= cost;
                  }
                  if (CampCoreComponent.lightEnergy[coreEid] >= cost) {
                    CampCoreComponent.lightEnergy[coreEid] -= cost;
                  }
                  // Recruited! Convert from Grayish Vagrant to Vibrant Green Citizen
                  UnitRole.role[targetVagrant] = RoleValues.PEASANT;
                  Health.current[targetVagrant] = 50;
                  Velocity.x[targetVagrant] = Math.sign(coreX - Position.x[targetVagrant]) * Speed.value[targetVagrant];
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
                  interactionCooldowns.set(pEid, 300);
                  if (PlayerControlled.energy[pEid] >= cost) {
                    PlayerControlled.energy[pEid] -= cost;
                  }
                  if (CampCoreComponent.lightEnergy[coreEid] >= cost) {
                    CampCoreComponent.lightEnergy[coreEid] -= cost;
                  }

                  if (poiType === 4) {
                    UnitRole.role[targetPeasant] = RoleValues.BUILDER;
                    Health.max[targetPeasant] = 75;
                    Health.current[targetPeasant] = 75;
                    Speed.value[targetPeasant] = 60;
                  } else if (poiType === 5) {
                    UnitRole.role[targetPeasant] = RoleValues.ARCHER;
                    Health.max[targetPeasant] = 80;
                    Health.current[targetPeasant] = 80;
                    Speed.value[targetPeasant] = 50;
                    addComponent(world, CombatTypeComponent, targetPeasant);
                    CombatTypeComponent.type[targetPeasant] = CombatTypeValues.Ranged;
                    addComponent(world, Attack, targetPeasant);
                    Attack.power[targetPeasant] = 15;
                    addComponent(world, FSMState, targetPeasant);
                    FSMState.state[targetPeasant] = FSMStateValues.IDLE;
                  } else if (poiType === 6) {
                    UnitRole.role[targetPeasant] = RoleValues.KNIGHT;
                    Health.max[targetPeasant] = 150;
                    Health.current[targetPeasant] = 150;
                    Speed.value[targetPeasant] = 70;
                    addComponent(world, CombatTypeComponent, targetPeasant);
                    CombatTypeComponent.type[targetPeasant] = CombatTypeValues.Melee;
                    addComponent(world, Attack, targetPeasant);
                    Attack.power[targetPeasant] = 25;
                    addComponent(world, FSMState, targetPeasant);
                    FSMState.state[targetPeasant] = FSMStateValues.IDLE;
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
