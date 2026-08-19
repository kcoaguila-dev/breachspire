import { IWorld, defineQuery, addEntity, addComponent } from "bitecs";
import {
  Position,
  WildernessPoiComponent,
  UnitRole,
  RoleValues,
  CampCoreComponent,
  Velocity,
  Speed,
  Health,
  FactionTag,
  FactionValues,
  DayNightCycle
} from "../components";

// ─────────────────────────────────────────────────────
// EXPORTED PURE LOGIC — testable by Vitest
// ─────────────────────────────────────────────────────

export function canPortalSpawn(currentVagrants: number, maxVagrants = 4): boolean {
  return currentVagrants < maxVagrants;
}

export function computeVagrantsToSpawn(currentVagrants: number, maxVagrants = 4, desiredSpawn = 2): number {
  if (currentVagrants >= maxVagrants) return 0;
  return Math.min(desiredSpawn, maxVagrants - currentVagrants);
}

// ─────────────────────────────────────────────────────
// SYSTEM FACTORY
// ─────────────────────────────────────────────────────

const poiQuery = defineQuery([WildernessPoiComponent, Position]);
const dayNightQuery = defineQuery([DayNightCycle]);
const peasantQuery = defineQuery([UnitRole, Position, Health]);
const coreQuery = defineQuery([CampCoreComponent, Position]);

export function createVagrantPortalSystem() {
  let lastSpawnDay = 0;

  return (world: IWorld, _delta: number): IWorld => {
    const dayNights = dayNightQuery(world);
    const pois = poiQuery(world);
    const cores = coreQuery(world);
    const peasants = peasantQuery(world);

    if (dayNights.length === 0 || cores.length === 0) return world;

    const dayEid = dayNights[0];
    const currentDay = DayNightCycle.dayNumber[dayEid];
    const isNight = DayNightCycle.isNight[dayEid] === 1;

    // Portals spawn at dawn of every new day
    if (!isNight && currentDay > lastSpawnDay) {
      lastSpawnDay = currentDay;

      const coreY = Position.y[cores[0]] || 650;

      for (let i = 0; i < pois.length; i++) {
        const poiEid = pois[i];
        // POI Type 3 = Vagrant Portal / Camp
        if (WildernessPoiComponent.poiType[poiEid] === 3) {
          const px = Position.x[poiEid];

          // Count existing unrecruited vagrants sitting at this portal
          let vagrantsAtPortal = 0;
          for (let j = 0; j < peasants.length; j++) {
            const peEid = peasants[j];
            if (
              Health.current[peEid] > 0 &&
              UnitRole.role[peEid] === RoleValues.VAGRANT &&
              Math.abs(Position.x[peEid] - px) < 120
            ) {
              vagrantsAtPortal++;
            }
          }

          // Spawn 1 or 2 new vagrants, up to cap of 4
          const toSpawn = computeVagrantsToSpawn(vagrantsAtPortal, 4, Math.random() < 0.5 ? 1 : 2);

          for (let s = 0; s < toSpawn; s++) {
            const vagrantEid = addEntity(world);
            addComponent(world, Position, vagrantEid);
            Position.x[vagrantEid] = px + (Math.random() * 60 - 30);
            Position.y[vagrantEid] = Position.y[poiEid] || coreY;

            addComponent(world, Velocity, vagrantEid);
            Velocity.x[vagrantEid] = 0;
            Velocity.y[vagrantEid] = 0;

            addComponent(world, Speed, vagrantEid);
            Speed.value[vagrantEid] = 45;

            addComponent(world, Health, vagrantEid);
            Health.max[vagrantEid] = 40;
            Health.current[vagrantEid] = 40;

            addComponent(world, FactionTag, vagrantEid);
            FactionTag.faction[vagrantEid] = FactionValues.Hero;

            addComponent(world, UnitRole, vagrantEid);
            UnitRole.role[vagrantEid] = RoleValues.VAGRANT;
            UnitRole.level[vagrantEid] = 1;
            UnitRole.xp[vagrantEid] = 0;
            UnitRole.nextLevelXp[vagrantEid] = 50;
          }
        }
      }
    }

    return world;
  };
}
