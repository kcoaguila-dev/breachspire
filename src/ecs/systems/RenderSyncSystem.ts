import Phaser from "phaser";
import { defineQuery, IWorld, enterQuery, exitQuery, hasComponent, removeEntity } from "bitecs";
import { Position, FactionTag, FactionValues, Health, CampCoreComponent, CampWallComponent, SpireComponent, FloorComponent, GameStateComponent, GameStateValues, Velocity, CombatTypeComponent, CanReachElevated, CombatTypeValues, WallBlueprint, WildernessPoiComponent, UnitRole, BlueprintStateValues, LevelUpEvent } from "../components";
import { getUnitTextureKey } from "../../gfx/TextureGenerator";
import { getWallDamageStage } from "./CampSiegeSystem";

export type RenderGameObject =
  | Phaser.GameObjects.Sprite
  | Phaser.GameObjects.Rectangle
  | Phaser.GameObjects.Container
  | Phaser.GameObjects.Image;

export type SpriteMap = Map<number, RenderGameObject>;

const unitQuery = defineQuery([Position, FactionTag, Health, Velocity]); // CombatTypeComponent might be optional for peasants/builders
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

const wallBlueprintQuery = defineQuery([WallBlueprint, Position]);
const wallBlueprintQueryEnter = enterQuery(wallBlueprintQuery);
const wallBlueprintQueryExit = exitQuery(wallBlueprintQuery);

const poiQuery = defineQuery([WildernessPoiComponent, Position]);
const poiQueryEnter = enterQuery(poiQuery);

const stateQuery = defineQuery([GameStateComponent]);

const levelUpEventQuery = defineQuery([LevelUpEvent]);

export function createRenderSyncSystem(scene: Phaser.Scene, spriteMap: SpriteMap) {
  let victoryBanner: Phaser.GameObjects.Text | null = null;
  let defeatBanner: Phaser.GameObjects.Text | null = null;

  // Create UI elements
  const unitHpGraphicsMap = new Map<number, Phaser.GameObjects.Graphics>();

  return (world: IWorld) => {
    // 1. Units
    const unitsEntered = unitQueryEnter(world);
    for (let i = 0; i < unitsEntered.length; i++) {
      const eid = unitsEntered[i];
      const faction = FactionTag.faction[eid];
      let combatType = 0;
      if (hasComponent(world, CombatTypeComponent, eid)) {
          combatType = CombatTypeComponent.type[eid];
      }
      const isFlying = hasComponent(world, CanReachElevated, eid);
      const role = hasComponent(world, UnitRole, eid) ? UnitRole.role[eid] : undefined;

      const textureId = getUnitTextureKey(faction, combatType, isFlying, role);
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

        if (hasComponent(world, UnitRole, eid)) {
            const role = UnitRole.role[eid];
            const combatType = hasComponent(world, CombatTypeComponent, eid) ? CombatTypeComponent.type[eid] : 0;
            const faction = FactionTag.faction[eid];
            const isFlying = hasComponent(world, CanReachElevated, eid);
            const textureId = getUnitTextureKey(faction, combatType, isFlying, role);
            if (sprite.texture.key !== textureId) {
                sprite.setTexture(textureId);
            }

            if (UnitRole.level[eid] === 2) {
                sprite.setTint(0xd0d8e8); // Silver
            } else if (UnitRole.level[eid] >= 3) {
                sprite.setTint(0xffea55); // Gold
            } else {
                sprite.clearTint();
            }

            // Hammering Dust Animation
            if (UnitRole.isConstructing[eid]) {
                // Spawn a quick fading tween circle
                if (Math.random() < 0.2) { // roughly every 5 frames
                    const dust = scene.add.circle(Position.x[eid] + (Math.random() * 10 - 5), Position.y[eid] - 5, 3, 0xaaaaaa, 0.8);
                    scene.tweens.add({
                        targets: dust,
                        y: dust.y - 15,
                        alpha: 0,
                        duration: 400,
                        onComplete: () => dust.destroy()
                    });
                }
            }
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
      const sprite = scene.add.sprite(Position.x[eid], Position.y[eid], "wall_stage_1_pristine");
      spriteMap.set(eid, sprite);
    }
    const walls = campWallQuery(world);
    for (let i = 0; i < walls.length; i++) {
      const eid = walls[i];
      const sprite = spriteMap.get(eid);

      if (sprite && sprite instanceof Phaser.GameObjects.Sprite) {
        sprite.setPosition(Position.x[eid], Position.y[eid]);
        const currentHp = Health.current[eid];
        const maxHp = Health.max[eid];

        if (currentHp <= 0) {
            sprite.setTexture("wall_rubble_collapsed");
            sprite.setAlpha(0.8);
            sprite.clearTint();
        } else {
            const stage = getWallDamageStage(currentHp, maxHp);
            let textureKey = "wall_stage_1_pristine";
            if (stage === 1) textureKey = "wall_stage_1_pristine";
            else if (stage === 2) textureKey = "wall_stage_2_cracked";
            else if (stage === 3) textureKey = "wall_stage_3_crumbling";
            else if (stage === 4) textureKey = "wall_stage_4_critical";

            sprite.setTexture(textureKey);
            sprite.setAlpha(1.0);
            sprite.clearTint();
        }
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

    // --- 4.5. Wall Blueprints ---
    const blueprintsEntered = wallBlueprintQueryEnter(world);
    for (let i = 0; i < blueprintsEntered.length; i++) {
        const eid = blueprintsEntered[i];
        const sprite = scene.add.sprite(Position.x[eid], Position.y[eid], "wall_foundation_mound");
        sprite.setOrigin(0.5, 1);
        spriteMap.set(eid, sprite);
    }
    const blueprintsExit = wallBlueprintQueryExit(world);
    for (let i = 0; i < blueprintsExit.length; i++) {
        const eid = blueprintsExit[i];
        const sprite = spriteMap.get(eid);
        if (sprite) {
            sprite.destroy();
            spriteMap.delete(eid);
        }
    }
    const blueprints = wallBlueprintQuery(world);
    for (let i = 0; i < blueprints.length; i++) {
        const eid = blueprints[i];
        const sprite = spriteMap.get(eid);
        if (sprite && sprite instanceof Phaser.GameObjects.Sprite) {
            const state = WallBlueprint.state[eid];
            if (state === BlueprintStateValues.MOUND) {
                if (sprite.texture.key !== "wall_foundation_mound") sprite.setTexture("wall_foundation_mound");
            } else if (state === BlueprintStateValues.ORDERED || state === BlueprintStateValues.BUILDING) {
                // Keep mound for now, maybe add particle effects in the future
                if (sprite.texture.key !== "wall_foundation_mound") sprite.setTexture("wall_foundation_mound");
            } else if (state === BlueprintStateValues.COMPLETED) {
                // The blueprint entity should probably be removed when completed, or we change its texture to clear
                sprite.setVisible(false);
            }
        }
    }

    // --- 4.6. POIs ---
    const poisEntered = poiQueryEnter(world);
    for (let i = 0; i < poisEntered.length; i++) {
        const eid = poisEntered[i];
        const type = WildernessPoiComponent.poiType[eid];
        let texture = "camp_core_hearth"; // fallback
        if (type === 3) texture = "camp_core_hearth";
        else if (type === 4) texture = "tool_hammer_stand";
        else if (type === 5) texture = "tool_bow_stand";
        else if (type === 6) texture = "tool_sword_stand";

        const sprite = scene.add.sprite(Position.x[eid], Position.y[eid], texture);
        sprite.setOrigin(0.5, 1);
        spriteMap.set(eid, sprite);
    }

    // --- 4.7 Level Up Events ---
    const levelUpEvents = levelUpEventQuery(world);
    for (let i = 0; i < levelUpEvents.length; i++) {
        const eventEid = levelUpEvents[i];
        const tx = LevelUpEvent.targetX[eventEid];
        const ty = LevelUpEvent.targetY[eventEid];
        const level = LevelUpEvent.level[eventEid];

        // Spawn text
        const text = scene.add.text(tx, ty, `★ LVL ${level}`, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffea55',
            stroke: '#000000',
            strokeThickness: 3
        });
        text.setOrigin(0.5, 0.5);

        scene.tweens.add({
            targets: text,
            y: ty - 40,
            alpha: 0,
            duration: 800,
            onComplete: () => text.destroy()
        });

        // Golden particle burst using circle tweens
        for(let p = 0; p < 8; p++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 20 + 10;
            const flare = scene.add.circle(tx, ty + 20, 2, 0xffea55, 1);
            scene.tweens.add({
                targets: flare,
                x: tx + Math.cos(angle) * speed,
                y: ty + 20 + Math.sin(angle) * speed,
                alpha: 0,
                duration: 600,
                onComplete: () => flare.destroy()
            });
        }

        removeEntity(world, eventEid);
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
