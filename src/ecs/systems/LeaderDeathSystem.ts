import { IWorld } from "bitecs";

// ─────────────────────────────────────────────────────
// SYSTEM FACTORY
// ─────────────────────────────────────────────────────

export function createLeaderDeathSystem() {
  return (world: IWorld, _delta: number): IWorld => {
    // Leader permadeath is handled by GameStateSystem
    return world;
  };
}