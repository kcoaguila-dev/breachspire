import { defineQuery, IWorld, enterQuery, exitQuery } from "bitecs";
import { Position, FactionTag, FactionValues, Health, CampCoreComponent, CampWallComponent, SpireComponent, FloorComponent, GameStateComponent, GameStateValues } from "../components";

const unitQuery = defineQuery([Position, FactionTag, Health]);
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

export function createRenderSyncSystem(scene: Phaser.Scene, spriteMap: Map<number, Phaser.GameObjects.Rectangle>) {
  let victoryBanner: Phaser.GameObjects.Text | null = null;
  let defeatBanner: Phaser.GameObjects.Text | null = null;

  // Create UI elements
  // We'll attach text to the spriteMap but text objects aren't rects. We can use standard scene elements.
  const wallHpTexts = new Map<number, Phaser.GameObjects.Text>();

  return (world: IWorld) => {
    // 1. Units
    const unitsEntered = unitQueryEnter(world);
    for (let i = 0; i < unitsEntered.length; i++) {
      const eid = unitsEntered[i];
      const faction = FactionTag.faction[eid];
      const color = faction === FactionValues.Hero ? 0x0000ff : 0xff0000;
      const rect = scene.add.rectangle(Position.x[eid], Position.y[eid], 32, 32, color);
      spriteMap.set(eid, rect);
    }

    const units = unitQuery(world);
    for (let i = 0; i < units.length; i++) {
      const eid = units[i];
      const rect = spriteMap.get(eid);
      if (rect) {
        if (Health.current[eid] <= 0) {
            rect.setAlpha(0.2); // Dead visually
        } else {
            rect.setPosition(Position.x[eid], Position.y[eid]);
        }
      }
    }

    const unitsExited = unitQueryExit(world);
    for (let i = 0; i < unitsExited.length; i++) {
      const eid = unitsExited[i];
      const rect = spriteMap.get(eid);
      if (rect) {
        rect.destroy();
        spriteMap.delete(eid);
      }
    }

    // 2. Camp Core
    const coresEntered = campCoreQueryEnter(world);
    for (let i = 0; i < coresEntered.length; i++) {
      const eid = coresEntered[i];
      const rect = scene.add.rectangle(Position.x[eid], Position.y[eid], 64, 64, 0xffff00); // Yellow core
      spriteMap.set(eid, rect);
    }
    const cores = campCoreQuery(world);
    for (let i = 0; i < cores.length; i++) {
      const eid = cores[i];
      const rect = spriteMap.get(eid);
      if (rect) {
        // Can pulse or update visually based on light energy here if desired
        rect.setPosition(Position.x[eid], Position.y[eid]);
      }
    }

    // 3. Camp Walls
    const wallsEntered = campWallQueryEnter(world);
    for (let i = 0; i < wallsEntered.length; i++) {
      const eid = wallsEntered[i];
      const rect = scene.add.rectangle(Position.x[eid], Position.y[eid], 32, 128, 0x888888); // Gray wall
      spriteMap.set(eid, rect);

      const hpText = scene.add.text(Position.x[eid] - 20, Position.y[eid] - 80, `HP: ${Health.current[eid]}`, { color: '#ffffff' });
      wallHpTexts.set(eid, hpText);
    }
    const walls = campWallQuery(world);
    for (let i = 0; i < walls.length; i++) {
      const eid = walls[i];
      const rect = spriteMap.get(eid);
      const hpText = wallHpTexts.get(eid);

      if (rect) {
        if (Health.current[eid] <= 0) {
          rect.setAlpha(0.2);
        } else {
          rect.setPosition(Position.x[eid], Position.y[eid]);
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
      const rect = scene.add.rectangle(Position.x[eid], Position.y[eid], 48, 48, 0x800080); // Purple Crystal
      spriteMap.set(eid, rect);
    }
    const spires = spireQuery(world);
    for (let i = 0; i < spires.length; i++) {
      const eid = spires[i];
      const rect = spriteMap.get(eid);
      if (rect) {
        if (Health.current[eid] <= 0) {
          rect.setAlpha(0.2);
        } else {
          // Move the crystal up as it grows!
          const floorCount = SpireComponent.floorCount[eid];
          rect.setPosition(Position.x[eid], Position.y[eid] - floorCount * 50 - 24);
        }
      }
    }

    // 5. Floors
    const floorsEntered = floorQueryEnter(world);
    for (let i = 0; i < floorsEntered.length; i++) {
      const eid = floorsEntered[i];
      const rect = scene.add.rectangle(Position.x[eid], Position.y[eid], 64, 16, 0x555555); // Dark scaffolding
      spriteMap.set(eid, rect);
    }
    const floors = floorQuery(world);
    for (let i = 0; i < floors.length; i++) {
      const eid = floors[i];
      const rect = spriteMap.get(eid);
      if (rect) {
        rect.setPosition(Position.x[eid], Position.y[eid]);
        if (FloorComponent.cleared[eid] === 1) {
            rect.setAlpha(0.3); // Visual cue for floor collapse
            rect.fillColor = 0x222222;
        } else {
            rect.setAlpha(1.0);
            rect.fillColor = 0x555555;
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
