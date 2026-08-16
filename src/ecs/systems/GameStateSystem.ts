import { defineQuery, IWorld } from "bitecs";
import { CampCoreComponent, GameStateComponent, GameStateValues, SpireComponent, Health, FactionTag, FactionValues, Position, PlayerControlled } from "../components";

const coreQuery = defineQuery([CampCoreComponent, Position]);
const spireQuery = defineQuery([SpireComponent, Health]);
const stateQuery = defineQuery([GameStateComponent]);
const monsterQuery = defineQuery([FactionTag, Health, Position]);
const playerQuery = defineQuery([PlayerControlled, Health]);

// ─────────────────────────────────────────────────────
// EXPORTED PURE LOGIC
// ─────────────────────────────────────────────────────
export function isLeaderDead(playerHp: number): boolean {
  return playerHp <= 0;
}

export function evaluateGameState(coreHp: number, leftSpireAlive: boolean, rightSpireAlive: boolean, leaderDead: boolean = false): GameStateValues {
  if (coreHp <= 0 || leaderDead) {
      return GameStateValues.DEFEAT;
  }
  if (!leftSpireAlive && !rightSpireAlive) {
      return GameStateValues.VICTORY;
  }
  return GameStateValues.RUNNING;
}

export function isMonsterBreachingCore(monsterX: number, monsterY: number, coreX: number, coreY: number, contactRadius: number = 40): boolean {
  const dx = monsterX - coreX;
  const dy = monsterY - coreY;
  return Math.sqrt(dx * dx + dy * dy) <= contactRadius;
}

// ─────────────────────────────────────────────────────
// SYSTEM FACTORY
// ─────────────────────────────────────────────────────
export function createGameStateSystem() {
  return (world: IWorld, _delta: number): IWorld => {
    const states = stateQuery(world);
    if (states.length === 0) return world; // No state component found

    const stateEid = states[0]; // Assuming only one GameStateComponent
    if (GameStateComponent.state[stateEid] !== GameStateValues.RUNNING) {
      return world; // Already over
    }

    const cores = coreQuery(world);
    let coreHp = 1; // Default assume alive if no core
    let coreX = 0;
    let coreY = 0;
    let hasCore = false;
    if (cores.length > 0) {
        const coreEid = cores[0];
        // The core has no HP component anymore per instructions, or we ignore it.
        // But evaluateGameState still checks coreHp. So we assume it's 1.
        coreHp = 1;
        coreX = Position.x[coreEid];
        coreY = Position.y[coreEid];
        hasCore = true;
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

    const players = playerQuery(world);
    let leaderDead = false;
    for (let i = 0; i < players.length; i++) {
        if (isLeaderDead(Health.current[players[i]])) {
            leaderDead = true;
            break;
        }
    }

    let nextState = evaluateGameState(coreHp, leftSpireAlive, rightSpireAlive, leaderDead);

    // Check for core breach
    if (nextState === GameStateValues.RUNNING && hasCore) {
      const monsters = monsterQuery(world);
      for (let i = 0; i < monsters.length; i++) {
        const monsterEid = monsters[i];
        if (FactionTag.faction[monsterEid] === FactionValues.Monster && Health.current[monsterEid] > 0) {
          const mx = Position.x[monsterEid];
          const my = Position.y[monsterEid];
          if (isMonsterBreachingCore(mx, my, coreX, coreY, 40)) {
            nextState = GameStateValues.DEFEAT;
            break;
          }
        }
      }
    }

    GameStateComponent.state[stateEid] = nextState;

    return world;
  };
}