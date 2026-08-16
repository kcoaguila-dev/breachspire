import { defineQuery, IWorld } from "bitecs";
import { CampCoreComponent, CampWallComponent, SpireComponent, Health, SpireSideValues } from "../components";
import { formatEnergyText, calculateBarFill } from "../../ui/HUDState";
import Phaser from "phaser";

const coreQuery = defineQuery([CampCoreComponent]);
const wallQuery = defineQuery([CampWallComponent, Health]);
const spireQuery = defineQuery([SpireComponent]);

export function createHUDSystem(scene: Phaser.Scene) {
  // Setup Phaser UI elements
  // We'll place HUD at the top/sides
  const uiElements: Phaser.GameObjects.GameObject[] = [];

  const textStyle = { fontSize: '16px', color: '#fff', backgroundColor: '#0008' };

  // Core Energy Text
  const coreEnergyText = scene.add.text(400, 20, 'Energy: 0/0', { fontSize: '20px', color: '#ffea00', backgroundColor: '#0008' }).setOrigin(0.5, 0);
  uiElements.push(coreEnergyText);

  // Left Wall Text + Bar
  const leftWallText = scene.add.text(20, 20, 'L Wall HP', textStyle);
  const leftWallBarBg = scene.add.rectangle(20, 40, 100, 10, 0x555555).setOrigin(0, 0);
  const leftWallBarFg = scene.add.rectangle(20, 40, 100, 10, 0x00ff00).setOrigin(0, 0);
  uiElements.push(leftWallText, leftWallBarBg, leftWallBarFg);

  // Right Wall Text + Bar
  const rightWallText = scene.add.text(780, 20, 'R Wall HP', textStyle).setOrigin(1, 0);
  const rightWallBarBg = scene.add.rectangle(780, 40, 100, 10, 0x555555).setOrigin(1, 0);
  const rightWallBarFg = scene.add.rectangle(780, 40, 100, 10, 0x00ff00).setOrigin(1, 0);
  uiElements.push(rightWallText, rightWallBarBg, rightWallBarFg);

  // Left Spire Floors
  const leftSpireText = scene.add.text(20, 60, 'L Spire: 0 Floors', textStyle);
  uiElements.push(leftSpireText);

  // Right Spire Floors
  const rightSpireText = scene.add.text(780, 60, 'R Spire: 0 Floors', textStyle).setOrigin(1, 0);
  uiElements.push(rightSpireText);

  // Ensure HUD is above game entities
  uiElements.forEach(el => {
    // Scroll factor 0 so it sticks to camera
    if ('setScrollFactor' in el) {
      (el as Phaser.GameObjects.Text | Phaser.GameObjects.Rectangle).setScrollFactor(0);
    }
    (el as any).setDepth(100);
  });

  return (world: IWorld, _delta: number): IWorld => {
    // 1. Update Core Energy
    const cores = coreQuery(world);
    if (cores.length > 0) {
      const coreEid = cores[0];
      const energy = CampCoreComponent.lightEnergy[coreEid];
      const max = CampCoreComponent.maxEnergy[coreEid];
      coreEnergyText.setText(formatEnergyText(energy, max));
    }

    // 2. Update Wall HPs
    const walls = wallQuery(world);
    // Reset bars if dead/missing
    leftWallBarFg.scaleX = 0;
    rightWallBarFg.scaleX = 0;

    for (let i = 0; i < walls.length; i++) {
      const wallEid = walls[i];
      const side = CampWallComponent.side[wallEid];
      const hp = Health.current[wallEid];
      const maxHp = Health.max[wallEid];
      const fill = calculateBarFill(hp, maxHp);

      if (side === SpireSideValues.Left) {
        leftWallBarFg.scaleX = fill;
      } else if (side === SpireSideValues.Right) {
        rightWallBarFg.scaleX = fill;
      }
    }

    // 3. Update Spire Floors
    const spires = spireQuery(world);
    // Defaults if missing
    leftSpireText.setText(`L Spire: Defeated`);
    rightSpireText.setText(`R Spire: Defeated`);

    for (let i = 0; i < spires.length; i++) {
      const spireEid = spires[i];
      // Only count active spires that are alive?
      // Wait, isAlive might be needed, but we can also just check if SpireComponent.isAlive is 1
      if (SpireComponent.isAlive[spireEid]) {
        const side = SpireComponent.side[spireEid];
        const floors = SpireComponent.floorCount[spireEid];
        if (side === SpireSideValues.Left) {
          leftSpireText.setText(`L Spire: ${floors} Floors`);
        } else if (side === SpireSideValues.Right) {
          rightSpireText.setText(`R Spire: ${floors} Floors`);
        }
      }
    }

    return world;
  };
}
