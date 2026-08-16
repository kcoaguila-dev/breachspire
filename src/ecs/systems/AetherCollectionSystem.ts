import { defineQuery, IWorld, removeEntity, addEntity, addComponent } from "bitecs";
import { AetherMoteComponent, Position, PlayerControlled, CampCoreComponent, AetherCollectEvent } from "../components";

const moteQuery = defineQuery([AetherMoteComponent, Position]);
const playerQuery = defineQuery([PlayerControlled, Position]);
const coreQuery = defineQuery([CampCoreComponent]);

// ─────────────────────────────────────────────────────
// EXPORTED PURE LOGIC — testable by Vitest
// ─────────────────────────────────────────────────────
export function getMoteInteraction(moteX: number, moteY: number, playerX: number, playerY: number, pickupRadius: number = 25, magnetRadius: number = 120): 'pickup' | 'magnet' | 'none' {
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

// ─────────────────────────────────────────────────────
// SYSTEM FACTORY
// ─────────────────────────────────────────────────────
export function createAetherCollectionSystem(audioManager: { playAetherCollect: () => void }) {
  return (world: IWorld, delta: number): IWorld => {
    const motes = moteQuery(world);
    if (motes.length === 0) return world;

    const players = playerQuery(world);
    if (players.length === 0) return world;

    // Use Player 1 for now
    let p1Eid = -1;
    for (let i = 0; i < players.length; i++) {
        if (PlayerControlled.playerId[players[i]] === 1) {
            p1Eid = players[i];
            break;
        }
    }
    if (p1Eid === -1) p1Eid = players[0];

    const px = Position.x[p1Eid];
    const py = Position.y[p1Eid];

    for (let i = 0; i < motes.length; i++) {
      const eid = motes[i];
      const mx = Position.x[eid];
      const my = Position.y[eid];

      const dx = px - mx;
      const dy = py - my;

      const interaction = getMoteInteraction(mx, my, px, py);

      if (interaction === 'pickup') {
        // Collect
        const cores = coreQuery(world);
        if (cores.length > 0) {
            const coreEid = cores[0];
            const maxEnergy = CampCoreComponent.maxEnergy[coreEid];
            CampCoreComponent.lightEnergy[coreEid] = clampEnergy(CampCoreComponent.lightEnergy[coreEid], 10, maxEnergy);
        }

        const eventEid = addEntity(world);
        addComponent(world, AetherCollectEvent, eventEid);
        AetherCollectEvent.x[eventEid] = mx;
        AetherCollectEvent.y[eventEid] = my;

        audioManager.playAetherCollect();
        removeEntity(world, eid);
      } else if (interaction === 'magnet') {
        // Magnetic pull
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 200; // pixels per second
        const vx = (dx / dist) * speed;
        const vy = (dy / dist) * speed;
        Position.x[eid] += (vx * delta) / 1000;
        Position.y[eid] += (vy * delta) / 1000;
      }
    }

    return world;
  };
}
