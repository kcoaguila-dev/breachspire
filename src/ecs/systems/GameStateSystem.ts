import { defineQuery, IWorld } from "bitecs";
import { CampCoreComponent, GameStateComponent, GameStateValues, SpireComponent, Health } from "../components";

const coreQuery = defineQuery([CampCoreComponent, Health]);
const spireQuery = defineQuery([SpireComponent, Health]);
const stateQuery = defineQuery([GameStateComponent]);

// ─────────────────────────────────────────────────────
// EXPORTED PURE LOGIC
// ─────────────────────────────────────────────────────
export function evaluateGameState(coreHp: number, leftSpireAlive: boolean, rightSpireAlive: boolean): GameStateValues {
  if (coreHp <= 0) {
      return GameStateValues.DEFEAT;
  }
  if (!leftSpireAlive && !rightSpireAlive) {
      return GameStateValues.VICTORY;
  }
  return GameStateValues.RUNNING;
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
    let coreHp = 1; // Default assume alive if no core
    if (cores.length > 0) {
        coreHp = Health.current[cores[0]];
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

    const nextState = evaluateGameState(coreHp, leftSpireAlive, rightSpireAlive);
    GameStateComponent.state[stateEid] = nextState;

    return world;
  };
}