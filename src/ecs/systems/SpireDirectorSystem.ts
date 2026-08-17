import { defineQuery, IWorld } from "bitecs";
import { SpireComponent, InvasionSpawner, DayNightCycle, Health } from "../components";

const spireQuery = defineQuery([SpireComponent, InvasionSpawner]);
const dayNightQuery = defineQuery([DayNightCycle]);

// ─────────────────────────────────────────────────────
// EXPORTED PURE LOGIC — testable by Vitest
// ─────────────────────────────────────────────────────
export function computeSpireEnergyRate(baseRate: number, activeFloors: number, totalFloors: number): number {
  if (totalFloors === 0) return 0;
  return baseRate * (activeFloors / totalFloors);
}

export type SpireAction = 'SPAWN_GOBLIN' | 'SPAWN_ARCHER' | 'SPAWN_TROLL' | 'FORTIFY_CRYSTAL' | 'REINFORCE_DEFENDERS' | 'WAIT';

export function decideSpireAction(darkEnergy: number, isNight: boolean): SpireAction {
  if (isNight) {
    // Prioritize spawning during the night based on available energy
    if (darkEnergy >= 60) return 'SPAWN_TROLL';
    if (darkEnergy >= 25) return 'SPAWN_ARCHER';
    if (darkEnergy >= 10) return 'SPAWN_GOBLIN';
    return 'WAIT';
  } else {
    // During day, save up or fortify crystal
    if (darkEnergy >= 40) return 'FORTIFY_CRYSTAL';
    return 'WAIT';
  }
}

// ─────────────────────────────────────────────────────
// SYSTEM FACTORY
// ─────────────────────────────────────────────────────
export function createSpireDirectorSystem() {
  return (world: IWorld, delta: number): IWorld => {
    const timeEids = dayNightQuery(world);
    const isNight = timeEids.length > 0 ? DayNightCycle.isNight[timeEids[0]] === 1 : true;

    const spires = spireQuery(world);

    for (let i = 0; i < spires.length; i++) {
      const eid = spires[i];
      if (SpireComponent.isAlive[eid] === 0) continue;

      const activeFloors = SpireComponent.floorCount[eid];
      const maxFloors = SpireComponent.maxFloors[eid];

      // Add energy based on rate and delta
      const rate = computeSpireEnergyRate(SpireComponent.darkEnergyRate[eid], activeFloors, maxFloors);
      SpireComponent.darkEnergy[eid] += rate * (delta / 1000);

      // Perform actions based on budget
      const action = decideSpireAction(SpireComponent.darkEnergy[eid], isNight);

      if (action === 'SPAWN_TROLL') {
        SpireComponent.darkEnergy[eid] -= 60;
        InvasionSpawner.pendingTrolls[eid]++;
      } else if (action === 'SPAWN_ARCHER') {
        SpireComponent.darkEnergy[eid] -= 25;
        InvasionSpawner.pendingArchers[eid]++;
      } else if (action === 'SPAWN_GOBLIN') {
        SpireComponent.darkEnergy[eid] -= 10;
        InvasionSpawner.pendingGoblins[eid]++;
      } else if (action === 'FORTIFY_CRYSTAL') {
        SpireComponent.darkEnergy[eid] -= 40;
        SpireComponent.crystalHP[eid] += 50;
        Health.max[eid] += 50;
        Health.current[eid] += 50;
      }
    }

    return world;
  };
}
