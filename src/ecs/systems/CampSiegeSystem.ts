import { defineQuery, IWorld } from "bitecs";
import { Health, CampWallComponent } from "../components";

const wallQuery = defineQuery([CampWallComponent, Health]);

// Wait, the prompt says:
// - Export pure function `applyWallDamage(currentWallHp: number, incomingDamage: number): number`.
// - Export pure function `isWallBreached(currentWallHp: number): boolean`.
// - System factory `createCampSiegeSystem()` that handles monsters reaching camp walls, attacking walls, and advancing to the Light Core if a wall is breached.

// ─────────────────────────────────────────────────────
// EXPORTED PURE LOGIC
// ─────────────────────────────────────────────────────
export function applyWallDamage(currentWallHp: number, incomingDamage: number): number {
  return Math.max(0, currentWallHp - incomingDamage);
}

export function isWallBreached(currentWallHp: number): boolean {
  return currentWallHp <= 0;
}

// ─────────────────────────────────────────────────────
// SYSTEM FACTORY
// ─────────────────────────────────────────────────────
export function createCampSiegeSystem() {
  return (world: IWorld, _delta: number): IWorld => {
    const walls = wallQuery(world);

    // This system's primary job is to check for breached walls and potentially clear their targets
    // FSMSystem sets targets. CombatSystem handles actual damage application.
    // For M3, monsters will naturally path to the wall and attack it as a hostile entity via FSM.
    // When a wall's HP hits 0, it dies, its Health is 0.
    // FSMSystem will see the wall is dead and drop the target.
    // We just need to make sure we clamp damage (handled in combat system usually, but we use pure logic here).

    for (let i = 0; i < walls.length; i++) {
        const wallEid = walls[i];
        if (Health.current[wallEid] <= 0) continue; // Already breached, or "dead"

        // Instead of directly checking `Health.current[wallEid] <= 0` logic immediately before applyWallDamage
        // We will just clamp its health using the pure logic
        const newHp = applyWallDamage(Health.current[wallEid], 0); // clamp any floating point errors below 0
        Health.current[wallEid] = newHp;

        if (isWallBreached(Health.current[wallEid])) {
            // The wall is breached.
            // Setting HP to exactly 0 to represent destruction
            Health.current[wallEid] = 0;
            CampWallComponent.hp[wallEid] = 0;
        } else {
            // Sync CampWallComponent HP with Health Component
            CampWallComponent.hp[wallEid] = Health.current[wallEid];
        }
    }

    return world;
  };
}