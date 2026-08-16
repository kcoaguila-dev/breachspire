import { defineQuery, IWorld, removeEntity, addEntity, addComponent } from "bitecs";
import { AetherMoteComponent, CampCoreComponent, Position, PlayerControlled, Health, AetherCollectEvent } from "../components";

const moteQuery = defineQuery([AetherMoteComponent, Position]);
const playerQuery = defineQuery([PlayerControlled, Position, Health]);
const campQuery = defineQuery([CampCoreComponent]);

// ─────────────────────────────────────────────────────
// EXPORTED PURE LOGIC
// ─────────────────────────────────────────────────────
export function shouldMagnetizeMote(playerX: number, playerY: number, moteX: number, moteY: number, magnetRadius: number): boolean {
  const dx = playerX - moteX;
  const dy = playerY - moteY;
  return dx * dx + dy * dy <= magnetRadius * magnetRadius;
}

export function computeMoteVelocity(moteX: number, moteY: number, targetX: number, targetY: number, speed: number): { vx: number, vy: number } {
  const dx = targetX - moteX;
  const dy = targetY - moteY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist === 0) return { vx: 0, vy: 0 };

  return {
    vx: (dx / dist) * speed,
    vy: (dy / dist) * speed
  };
}

export function isMoteCollected(moteX: number, moteY: number, playerX: number, playerY: number, pickupRadius: number): boolean {
  const dx = playerX - moteX;
  const dy = playerY - moteY;
  return dx * dx + dy * dy <= pickupRadius * pickupRadius;
}

// ─────────────────────────────────────────────────────
// SYSTEM FACTORY
// ─────────────────────────────────────────────────────
export function createAetherCollectionSystem() {
  const orbitRadiusX = 40;
  const orbitRadiusY = 15;
  const orbitSpeed = 0.001; // Radians per ms
  const magnetSpeed = 300; // Pixels per second
  const magnetRadius = 120;
  const pickupRadius = 25;

  return (world: IWorld, delta: number): IWorld => {
    const players = playerQuery(world);
    const playerEid = players.length > 0 ? players[0] : -1;

    let px = 0, py = 0, playerIsAlive = false;
    if (playerEid !== -1) {
       px = Position.x[playerEid];
       py = Position.y[playerEid];
       playerIsAlive = Health.current[playerEid] > 0;
    }

    const motes = moteQuery(world);
    const camps = campQuery(world);
    const campEid = camps.length > 0 ? camps[0] : -1;

    for (let i = 0; i < motes.length; i++) {
      const eid = motes[i];

      const isMagnetized = AetherMoteComponent.isMagnetized[eid] === 1;

      if (!isMagnetized) {
        // Orbit logic
        let angle = AetherMoteComponent.orbitAngle[eid];
        angle += orbitSpeed * delta;
        AetherMoteComponent.orbitAngle[eid] = angle;

        const ox = AetherMoteComponent.originX[eid];
        const oy = AetherMoteComponent.originY[eid];

        Position.x[eid] = ox + Math.cos(angle) * orbitRadiusX;
        // Add a gentle sine-wave bobbing
        Position.y[eid] = oy + Math.sin(angle) * orbitRadiusY + Math.sin(angle * 2) * 5;

        if (playerIsAlive && shouldMagnetizeMote(px, py, Position.x[eid], Position.y[eid], magnetRadius)) {
           AetherMoteComponent.isMagnetized[eid] = 1;
        }
      } else {
        // Magnetized logic - move toward player
        if (playerIsAlive) {
            const vel = computeMoteVelocity(Position.x[eid], Position.y[eid], px, py, magnetSpeed);
            Position.x[eid] += vel.vx * (delta / 1000);
            Position.y[eid] += vel.vy * (delta / 1000);

            if (isMoteCollected(Position.x[eid], Position.y[eid], px, py, pickupRadius)) {
                // Collect mote
                if (campEid !== -1) {
                    const gain = AetherMoteComponent.value[eid];
                    const current = CampCoreComponent.lightEnergy[campEid];
                    const max = CampCoreComponent.maxEnergy[campEid];
                    CampCoreComponent.lightEnergy[campEid] = Math.min(max, current + gain);
                }

                // Spawn AetherCollectEvent entity
                const eventEid = addEntity(world);
                addComponent(world, AetherCollectEvent, eventEid);
                AetherCollectEvent.x[eventEid] = Position.x[eid];
                AetherCollectEvent.y[eventEid] = Position.y[eid];

                removeEntity(world, eid);
            }
        } else {
            // Player died or went missing while mote was magnetized, reset it to orbit current position
            AetherMoteComponent.isMagnetized[eid] = 0;
            AetherMoteComponent.originX[eid] = Position.x[eid];
            AetherMoteComponent.originY[eid] = Position.y[eid];
        }
      }
    }

    return world;
  };
}
