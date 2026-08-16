import { defineQuery, IWorld, enterQuery, exitQuery, hasComponent } from "bitecs";
import { Position, FactionTag, FactionValues, Health, CampCoreComponent, CampWallComponent, SpireComponent, FloorComponent, GameStateComponent, GameStateValues, Velocity, CombatTypeComponent, CanReachElevated, CombatTypeValues } from "../components";
import { getUnitTextureKey } from "../../gfx/TextureGenerator";

export type RenderGameObject =
  | Phaser.GameObjects.Sprite
  | Phaser.GameObjects.Rectangle
  | Phaser.GameObjects.Container
  | Phaser.GameObjects.Image;

export type SpriteMap = Map<number, RenderGameObject>;

const unitQuery = defineQuery([Position, FactionTag, Health, Velocity, CombatTypeComponent]);
const unitQueryEnter = enterQuery(unitQuery);
const unitQueryExit = exitQuery(unitQuery);

const campCoreQuery = defineQuery([Position, CampCoreComponent]);
const campCoreQueryEnter = enterQuery(campCoreQuery);

const campWallQuery = defineQuery([Position, CampWallComponent, Health]);
const campWallQueryEnter = enterQuery(campWallQuery);

const spireQuery = defineQuery([Position, SpireComponent, Health]);
const spireQueryEnter = enterQuery(spireQuery);

const floorQuery = defineQuery([Position, FloorComponent]);
const floorQueryEnter = enterQuery(floorQuery);

const stateQuery = defineQuery([GameStateComponent]);

export function createRenderSyncSystem(scene: Phaser.Scene, spriteMap: SpriteMap) {
  let victoryBanner: Phaser.GameObjects.Text | null = null;
  let defeatBanner: Phaser.GameObjects.Text | null = null;

  // Create UI elements
  // We'll attach text to the spriteMap but text objects aren't rects. We can use standard scene elements.
  const wallHpTexts = new Map<number, Phaser.GameObjects.Text>();
  const unitHpGraphicsMap = new Map<number, Phaser.GameObjects.Graphics>();

  return (world: IWorld) => {
    // 1. Units
    const unitsEntered = unitQueryEnter(world);
    for (let i = 0; i < unitsEntered.length; i++) {
      const eid = unitsEntered[i];
      const faction = FactionTag.faction[eid];
      const combatType = CombatTypeComponent.type[eid];
      const isFlying = hasComponent(world, CanReachElevated, eid);

      const textureId = getUnitTextureKey(faction, combatType, isFlying);
      const sprite = scene.add.sprite(Position.x[eid], Position.y[eid], textureId);
      spriteMap.set(eid, sprite);

      const hpGraphics = scene.add.graphics();
      unitHpGraphicsMap.set(eid, hpGraphics);
    }

    const units = unitQuery(world);
    for (let i = 0; i < units.length; i++) {
      const eid = units[i];
      const sprite = spriteMap.get(eid);
      const hpGraphics = unitHpGraphicsMap.get(eid);

      if (sprite && sprite instanceof Phaser.GameObjects.Sprite) {
        sprite.setFlipX(Velocity.x[eid] < 0);

        if (Health.current[eid] <= 0) {
            sprite.setAlpha(0.2); // Dead visually
        } else {
            sprite.setPosition(Position.x[eid], Position.y[eid]);
        }
      }

      if (hpGraphics) {
        hpGraphics.clear();
        if (Health.current[eid] > 0) {
          const w = 32;
          const h = 4;
          const x = Position.x[eid] - w / 2;
          const y = Position.y[eid] - 24;

          const hpRatio = Math.max(0, Health.current[eid] / Health.max[eid]);
          const faction = FactionTag.faction[eid];
          const fillColor = faction === FactionValues.Hero ? 0x00ff00 : 0xff0000;

          // Background
          hpGraphics.fillStyle(0x000000, 0.8);
          hpGraphics.fillRect(x, y, w, h);

          // Fill
          hpGraphics.fillStyle(fillColor, 1.0);
          hpGraphics.fillRect(x, y, w * hpRatio, h);

          // Aura for flying units
          if (hasComponent(world, CanReachElevated, eid)) {
            hpGraphics.lineStyle(2, 0x00ffff, 0.5);
            hpGraphics.strokeCircle(Position.x[eid], Position.y[eid], 20);
          }

          // RPS Badge
          const combatType = CombatTypeComponent.type[eid];
          const badgeX = x + w / 2;
          const badgeY = y - 8;
          hpGraphics.fillStyle(0x000000, 0.5);
          hpGraphics.fillCircle(badgeX, badgeY, 6);
          if (combatType === CombatTypeValues.Melee) {
            hpGraphics.fillStyle(0xc0c0c0, 1.0); // Silver sword
          } else if (combatType === CombatTypeValues.Ranged) {
            hpGraphics.fillStyle(0x2ecc71, 1.0); // Green bow
          } else {
            hpGraphics.fillStyle(0x9b59b6, 1.0); // Purple magic
          }
          hpGraphics.fillCircle(badgeX, badgeY, 4);
        }
      }
    }

    const unitsExited = unitQueryExit(world);
    for (let i = 0; i < unitsExited.length; i++) {
      const eid = unitsExited[i];
      const sprite = spriteMap.get(eid);
      if (sprite) {
        sprite.destroy();
        spriteMap.delete(eid);
      }

      const hpGraphics = unitHpGraphicsMap.get(eid);
      if (hpGraphics) {
        hpGraphics.destroy();
        unitHpGraphicsMap.delete(eid);
      }
    }

    // 2. Camp Core
    const coresEntered = campCoreQueryEnter(world);
    for (let i = 0; i < coresEntered.length; i++) {
      const eid = coresEntered[i];
      const sprite = scene.add.sprite(Position.x[eid], Position.y[eid], "camp_core_hearth");
      spriteMap.set(eid, sprite);
    }
    const cores = campCoreQuery(world);
    for (let i = 0; i < cores.length; i++) {
      const eid = cores[i];
      const sprite = spriteMap.get(eid);
      if (sprite && sprite instanceof Phaser.GameObjects.Sprite) {
        sprite.setPosition(Position.x[eid], Position.y[eid]);
        // Pulse animation based on time
        const time = scene.time.now;
        const scale = 1.0 + Math.sin(time / 200) * 0.1;
        sprite.setScale(scale);
      }
    }

    // 3. Camp Walls
    const wallsEntered = campWallQueryEnter(world);
    for (let i = 0; i < wallsEntered.length; i++) {
      const eid = wallsEntered[i];
      const sprite = scene.add.sprite(Position.x[eid], Position.y[eid], "camp_wall_stone");
      spriteMap.set(eid, sprite);

      const hpText = scene.add.text(Position.x[eid] - 20, Position.y[eid] - 80, `HP: ${Health.current[eid]}`, { color: '#ffffff' });
      wallHpTexts.set(eid, hpText);
    }
    const walls = campWallQuery(world);
    for (let i = 0; i < walls.length; i++) {
      const eid = walls[i];
      const sprite = spriteMap.get(eid);
      const hpText = wallHpTexts.get(eid);

      if (sprite && sprite instanceof Phaser.GameObjects.Sprite) {
        sprite.setPosition(Position.x[eid], Position.y[eid]);
        const healthRatio = Health.current[eid] / Health.max[eid];
        if (Health.current[eid] <= 0) {
          sprite.setAlpha(0.2);
        } else if (healthRatio < 0.5) {
          sprite.setTint(0xffaaaa); // visually degrade by tinting red-ish
        } else {
          sprite.clearTint();
          sprite.setAlpha(1.0);
        }
      }

      if (hpText) {
          hpText.setText(`HP: ${Health.current[eid]}`);
          hpText.setPosition(Position.x[eid] - 20, Position.y[eid] - 80);
      }
    }

    // 4. Spires
    const spiresEntered = spireQueryEnter(world);
    for (let i = 0; i < spiresEntered.length; i++) {
      const eid = spiresEntered[i];
      const sprite = scene.add.sprite(Position.x[eid], Position.y[eid], "spire_dark_crystal");
      spriteMap.set(eid, sprite);
    }
    const spires = spireQuery(world);
    for (let i = 0; i < spires.length; i++) {
      const eid = spires[i];
      const sprite = spriteMap.get(eid);
      if (sprite && sprite instanceof Phaser.GameObjects.Sprite) {
        if (Health.current[eid] <= 0) {
          sprite.setAlpha(0.2);
        } else {
          const floorCount = SpireComponent.floorCount[eid];
          sprite.setPosition(Position.x[eid], Position.y[eid] - floorCount * 50 - 24);
          const time = scene.time.now;
          sprite.setAlpha(0.8 + Math.sin(time / 150) * 0.2);
        }
      }
    }

    // 5. Floors
    const floorsEntered = floorQueryEnter(world);
    for (let i = 0; i < floorsEntered.length; i++) {
      const eid = floorsEntered[i];
      const container = scene.add.container(Position.x[eid], Position.y[eid]);

      const platform = scene.add.sprite(0, 0, "spire_floor_platform");
      const wall = scene.add.sprite(0, -32, "spire_cutaway_wall");
      const barricade = scene.add.sprite(0, -16, "spire_barricade_gate");

      container.add([wall, platform, barricade]);
      spriteMap.set(eid, container);
    }
    const floors = floorQuery(world);
    for (let i = 0; i < floors.length; i++) {
      const eid = floors[i];
      const container = spriteMap.get(eid);
      if (container && container instanceof Phaser.GameObjects.Container) {
        container.setPosition(Position.x[eid], Position.y[eid]);
        if (FloorComponent.cleared[eid] === 1) {
            container.setAlpha(0.3);
            container.each((child: any) => child.setTint(0x555555));
        } else {
            container.setAlpha(1.0);
            container.each((child: any) => child.clearTint());
        }
      }
    }

    // 6. Game State
    const states = stateQuery(world);
    if (states.length > 0) {
        const stateEid = states[0];
        const state = GameStateComponent.state[stateEid];

        if (state === GameStateValues.VICTORY) {
            if (!victoryBanner) {
                victoryBanner = scene.add.text(400, 200, "VICTORY!", { fontSize: '64px', color: '#00ff00' }).setOrigin(0.5);
            }
        } else if (state === GameStateValues.DEFEAT) {
            if (!defeatBanner) {
                defeatBanner = scene.add.text(400, 200, "DEFEAT!", { fontSize: '64px', color: '#ff0000' }).setOrigin(0.5);
            }
        }
    }

    return world;
  };
}
