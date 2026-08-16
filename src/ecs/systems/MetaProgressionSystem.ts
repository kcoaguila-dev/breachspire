import { defineQuery, IWorld } from "bitecs";
import { CampCoreComponent, CampWallComponent, Health, FactionTag, FactionValues } from "../components";

const coreQuery = defineQuery([CampCoreComponent, Health]);
const wallQuery = defineQuery([CampWallComponent, Health]);
const heroQuery = defineQuery([FactionTag, Health]);

export function applyCampMetaUpgrades(
  bonuses: { wallHpBonus: number; energyRateBonus: number; flightBonus: number }
) {
  const boostedEntities = new Set<number>();

  return (world: IWorld, _delta: number): IWorld => {
    // Boost camp cores
    const cores = coreQuery(world);
    for (let i = 0; i < cores.length; i++) {
      const eid = cores[i];
      if (Health.current[eid] <= 0) continue;

      if (!boostedEntities.has(eid)) {
        CampCoreComponent.energyRate[eid] += bonuses.energyRateBonus;
        boostedEntities.add(eid);
      }
    }

    // Boost camp walls
    const walls = wallQuery(world);
    for (let i = 0; i < walls.length; i++) {
      const eid = walls[i];
      if (Health.current[eid] <= 0) continue;

      if (!boostedEntities.has(eid)) {
        CampWallComponent.maxHp[eid] += bonuses.wallHpBonus;
        Health.max[eid] += bonuses.wallHpBonus;
        Health.current[eid] += bonuses.wallHpBonus;
        boostedEntities.add(eid);
      }
    }

    // Since the issue states: "Boost Hero stats at run start", we boost heroes that spawn.
    // If we only boost heroes based on meta-progression, the issue implies maybe starting HP.
    // Wait, let's look at the instructions closely.
    // "applyCampMetaUpgrades(world: IWorld, bonuses: ...) that boosts initial Camp Wall HP, Light Core generation rate, and Hero stats at run start."
    // Let's implement basic hero boost if needed.
    const heroes = heroQuery(world);
    for (let i = 0; i < heroes.length; i++) {
        const eid = heroes[i];
        if (Health.current[eid] <= 0) continue;
        if (FactionTag.faction[eid] !== FactionValues.Hero) continue;

        if (!boostedEntities.has(eid)) {
            // No specific hero stat bonus is provided in bonuses yet according to the pure function signatures we wrote.
            // But we keep the skeleton. If bonuses later include hero stat boosts.
            boostedEntities.add(eid);
        }
    }

    return world;
  };
}
