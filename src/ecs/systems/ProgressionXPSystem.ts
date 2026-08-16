import { IWorld, defineQuery, addEntity, addComponent } from "bitecs";
import { UnitRole, LevelUpEvent, Position } from "../components";

export function computeXpGain(currentXp: number, xpGained: number, nextLevelXp: number): { newLevel: number, remainingXp: number, didLevelUp: boolean } {
  let totalXp = currentXp + xpGained;
  let levelUps = 0;
  let remainingNextLevelXp = nextLevelXp;
  let didLevelUp = false;

  while (totalXp >= remainingNextLevelXp) {
    totalXp -= remainingNextLevelXp;
    levelUps++;
    remainingNextLevelXp = Math.floor(remainingNextLevelXp * 1.5);
    didLevelUp = true;
  }

  return { newLevel: levelUps, remainingXp: totalXp, didLevelUp };
}

const unitQuery = defineQuery([UnitRole]);

export function createProgressionXPSystem() {
  return (world: IWorld, _delta: number) => {
    const units = unitQuery(world);

    for (let i = 0; i < units.length; i++) {
      const eid = units[i];
      const xp = UnitRole.xp[eid];
      const nextLevelXp = UnitRole.nextLevelXp[eid];

      if (xp >= nextLevelXp) {
        const result = computeXpGain(xp, 0, nextLevelXp);
        if (result.didLevelUp) {
          const oldLevel = UnitRole.level[eid];
          UnitRole.level[eid] += result.newLevel;
          // cap at level 3
          if (UnitRole.level[eid] > 3) UnitRole.level[eid] = 3;

          if (UnitRole.level[eid] > oldLevel) {
            const eventEid = addEntity(world);
            addComponent(world, LevelUpEvent, eventEid);
            LevelUpEvent.targetX[eventEid] = Position.x[eid];
            LevelUpEvent.targetY[eventEid] = Position.y[eid] - 40;
            LevelUpEvent.level[eventEid] = UnitRole.level[eid];
          }

          UnitRole.xp[eid] = result.remainingXp;
          // re-calculate nextLevelXp based on current level (since we allow multi-level ups we just set the new requirement)
          let newReq = 50; // base
          for (let l = 1; l < UnitRole.level[eid]; l++) {
            newReq = Math.floor(newReq * 1.5);
          }
          UnitRole.nextLevelXp[eid] = newReq;
        }
      }
    }

    return world;
  };
}
