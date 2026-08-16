import { defineQuery, IWorld, removeEntity, hasComponent, addEntity, addComponent } from "bitecs";
import { Health, FactionTag, FactionValues, Position, AetherMoteComponent } from "../components";
import { SpriteMap } from "./RenderSyncSystem";

// All entities that have Health — DeathSystem evaluates every one per frame.
const mortalQuery = defineQuery([Health]);

// ─────────────────────────────────────────────────────
// PURE LOGIC — testable without world or Phaser
// ─────────────────────────────────────────────────────

/**
 * Returns true if an entity with this HP value should be removed this frame.
 * Centralizing this check makes it trivially testable and easy to extend
 * (e.g., add a "corpse lingers for 0.5s" delay by passing a deathTimestamp).
 */
export function isDead(currentHP: number): boolean {
  return currentHP <= 0;
}

// ─────────────────────────────────────────────────────
// SYSTEM FACTORY
// ─────────────────────────────────────────────────────

/**
 * DeathSystem removes any entity whose Health.current <= 0 from the ECS world
 * and destroys its corresponding Phaser sprite.
 *
 * Must run AFTER CombatSystem and BEFORE RenderSyncSystem.
 *
 * @param spriteMap - The same Map<eid, Phaser.GameObjects.Rectangle> used by RenderSyncSystem.
 *                    Sprites are destroyed here so RenderSyncSystem never sees a dead entity.
 */
export function createDeathSystem(spriteMap: SpriteMap) {
  return (world: IWorld): IWorld => {
    const entities = mortalQuery(world);

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];

      if (isDead(Health.current[eid])) {
        // Drop Aether Motes if it's a monster
        if (hasComponent(world, FactionTag, eid) && FactionTag.faction[eid] === FactionValues.Monster) {
          if (hasComponent(world, Position, eid)) {
            const dropCount = Math.floor(Math.random() * 2) + 1; // 1-2 motes
            for (let j = 0; j < dropCount; j++) {
              const moteEid = addEntity(world);
              addComponent(world, Position, moteEid);
              Position.x[moteEid] = Position.x[eid];
              Position.y[moteEid] = Position.y[eid];

              addComponent(world, AetherMoteComponent, moteEid);
              AetherMoteComponent.value[moteEid] = 5; // Wilderness drops might be worth less
              AetherMoteComponent.isMagnetized[moteEid] = 0;
              AetherMoteComponent.isHearthMote[moteEid] = 0;
              AetherMoteComponent.originX[moteEid] = Position.x[eid] + (Math.random() * 20 - 10);
              AetherMoteComponent.originY[moteEid] = Position.y[eid] + (Math.random() * 10 - 5);
              AetherMoteComponent.orbitAngle[moteEid] = Math.random() * Math.PI * 2;
            }
          }
        }

        // Destroy the Phaser visual object first
        const sprite = spriteMap.get(eid);
        if (sprite) {
          sprite.destroy();
          spriteMap.delete(eid);
        }

        // Remove the entity from the world — this fires exitQuery in RenderSyncSystem
        // but since we already deleted from spriteMap, the exitQuery handler is a no-op.
        removeEntity(world, eid);
      }
    }

    return world;
  };
}
