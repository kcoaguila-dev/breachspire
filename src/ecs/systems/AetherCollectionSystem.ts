import { defineQuery, IWorld, removeEntity, addEntity, addComponent } from "bitecs";
import { AetherMoteComponent, Position, PlayerControlled, CampCoreComponent, AetherCollectEvent } from "../components";

const moteQuery = defineQuery([AetherMoteComponent, Position]);
const playerQuery = defineQuery([PlayerControlled, Position]);
const coreQuery = defineQuery([CampCoreComponent]);

// ─────────────────────────────────────────────────────
// EXPORTED PURE LOGIC — testable by Vitest
// ─────────────────────────────────────────────────────
export function getMoteInteraction(moteX: number, moteY: number, playerX: number, playerY: number, pickupRadius: number = 30, magnetRadius: number = 130): 'pickup' | 'magnet' | 'none' {
  const dx = playerX - moteX;
  const dy = playerY - moteY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist <= pickupRadius) return 'pickup';
  if (dist <= magnetRadius) return 'magnet';
  return 'none';
}

export function clampEnergy(currentEnergy: number, amount: number, maxEnergy: number): number {
  return Math.min(currentEnergy + amount, maxEnergy);
}

export function shouldMoteDespawn(lifetime: number): boolean {
  return lifetime <= 0;
}

// ─────────────────────────────────────────────────────
// SYSTEM FACTORY
// ─────────────────────────────────────────────────────
export function createAetherCollectionSystem(audioManager: { playAetherCollect: () => void }) {
  return (world: IWorld, delta: number): IWorld => {
    const motes = moteQuery(world);
    if (motes.length === 0) return world;

    const players = playerQuery(world);

    // 1. Process Despawn Timer for all motes
    for (let i = 0; i < motes.length; i++) {
      const eid = motes[i];
      if (AetherMoteComponent.lifetime[eid] !== undefined && AetherMoteComponent.lifetime[eid] > 0) {
        AetherMoteComponent.lifetime[eid] -= delta;
        if (shouldMoteDespawn(AetherMoteComponent.lifetime[eid])) {
          removeEntity(world, eid);
          continue;
        }
      }
    }

    if (players.length === 0) return world;

    // 2. Process Interaction with all active Players (P1 and P2)
    const cores = coreQuery(world);
    const coreEid = cores.length > 0 ? cores[0] : -1;

    for (let i = 0; i < motes.length; i++) {
      const eid = motes[i];
      const mx = Position.x[eid];
      const my = Position.y[eid];

      // Find closest player
      let closestPlayer = -1;
      let minDistance = Infinity;

      for (let p = 0; p < players.length; p++) {
        const pEid = players[p];
        const px = Position.x[pEid];
        const py = Position.y[pEid];
        const dx = px - mx;
        const dy = py - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < minDistance) {
          minDistance = dist;
          closestPlayer = pEid;
        }
      }

      if (closestPlayer !== -1) {
        const px = Position.x[closestPlayer];
        const py = Position.y[closestPlayer];
        const dx = px - mx;
        const dy = py - my;

        const interaction = getMoteInteraction(mx, my, px, py);

        if (interaction === 'pickup') {
          // Collect into shared core
          if (coreEid !== -1) {
            const maxEnergy = CampCoreComponent.maxEnergy[coreEid] || 100;
            const moteValue = AetherMoteComponent.value[eid] || 5;
            CampCoreComponent.lightEnergy[coreEid] = clampEnergy(CampCoreComponent.lightEnergy[coreEid], moteValue, maxEnergy);
          }

          const eventEid = addEntity(world);
          addComponent(world, AetherCollectEvent, eventEid);
          AetherCollectEvent.x[eventEid] = mx;
          AetherCollectEvent.y[eventEid] = my;

          audioManager.playAetherCollect();
          removeEntity(world, eid);
        } else if (interaction === 'magnet') {
          // Magnetic pull towards closest player
          const dist = Math.sqrt(dx * dx + dy * dy);
          const speed = 220; // pixels per second
          const vx = (dx / dist) * speed;
          const vy = (dy / dist) * speed;
          Position.x[eid] += (vx * delta) / 1000;
          Position.y[eid] += (vy * delta) / 1000;
        }
      }
    }

    return world;
  };
}
