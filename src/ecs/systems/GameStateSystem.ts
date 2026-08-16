import { defineQuery, IWorld } from "bitecs";
import { CampCoreComponent, GameStateComponent, GameStateValues, SpireComponent, Health, Position, FactionTag, FactionValues } from "../components";

const coreQuery = defineQuery([CampCoreComponent, Position]);
const spireQuery = defineQuery([SpireComponent, Health]);
const stateQuery = defineQuery([GameStateComponent]);
const monsterQuery = defineQuery([Position, Health, FactionTag]);

// ─────────────────────────────────────────────────────
// EXPORTED PURE LOGIC
// ─────────────────────────────────────────────────────
export function evaluateGameState(isCoreBreached: boolean, leftSpireAlive: boolean, rightSpireAlive: boolean): GameStateValues {
  if (isCoreBreached) {
      return GameStateValues.DEFEAT;
  }
  if (!leftSpireAlive && !rightSpireAlive) {
      return GameStateValues.VICTORY;
  }
  return GameStateValues.RUNNING;
}

export function isMonsterBreachingCore(
  monsterX: number,
  monsterY: number,
  coreX: number,
  coreY: number,
  contactRadius: number = 40
): boolean {
  const dx = Math.abs(monsterX - coreX);
  const dy = Math.abs(monsterY - coreY);
  return dx <= contactRadius && dy <= 60;
}

// ─────────────────────────────────────────────────────
// SYSTEM FACTORY
// ─────────────────────────────────────────────────────
export function createGameStateSystem() {
  return (world: IWorld, _delta: number): IWorld => {
    const states = stateQuery(world);
    if (states.length === 0) return world; // No state component found

    const stateEid = states[0]; // Assuming only one GameStateComponent

    const cores = coreQuery(world);
    let isCoreBreached = false;
    let coreX = 1600;
    let coreY = 650;

    if (cores.length > 0) {
        const coreEid = cores[0];
        coreX = Position.x[coreEid];
        coreY = Position.y[coreEid];
    }

    const monsters = monsterQuery(world);
    for (let i = 0; i < monsters.length; i++) {
        const monsterEid = monsters[i];
        if (Health.current[monsterEid] <= 0) continue;
        if (FactionTag.faction[monsterEid] === FactionValues.Monster) {
            const mx = Position.x[monsterEid];
            const my = Position.y[monsterEid];
            if (isMonsterBreachingCore(mx, my, coreX, coreY)) {
                isCoreBreached = true;
                break;
            }
        }
    }

    const spires = spireQuery(world);
    let leftSpireAlive = false;
    let rightSpireAlive = false;

    for (let i = 0; i < spires.length; i++) {
        const spireEid = spires[i];
        const side = SpireComponent.side[spireEid];
        const isAlive = Health.current[spireEid] > 0;

        if (side === 0) {
            leftSpireAlive = isAlive;
        } else if (side === 1) {
            rightSpireAlive = isAlive;
        }
    }

    const nextState = evaluateGameState(isCoreBreached, leftSpireAlive, rightSpireAlive);
    GameStateComponent.state[stateEid] = nextState;

    return world;
  };
}
