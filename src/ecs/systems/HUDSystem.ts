import { defineQuery, IWorld } from "bitecs";
import { CampCoreComponent, SpireComponent, SpireSideValues, DayNightCycle } from "../components";
import { formatEnergyText } from "../../ui/HUDState";
import Phaser from "phaser";

const coreQuery = defineQuery([CampCoreComponent]);
const spireQuery = defineQuery([SpireComponent]);
const dayNightQuery = defineQuery([DayNightCycle]);

export function createHUDSystem(scene: Phaser.Scene) {
  // Setup Phaser UI elements
  // We'll place HUD at the top/sides
  const uiElements: Phaser.GameObjects.GameObject[] = [];

  const textStyle = { fontSize: '16px', color: '#fff', backgroundColor: '#0008' };

  // Core Energy Text
  const coreEnergyText = scene.add.text(400, 20, 'Energy: 0/0', { fontSize: '20px', color: '#ffea00', backgroundColor: '#0008' }).setOrigin(0.5, 0);
  uiElements.push(coreEnergyText);

  // Left Spire Floors
  const leftSpireText = scene.add.text(20, 60, 'L Spire: 0 Floors', textStyle);
  uiElements.push(leftSpireText);

  // Right Spire Floors
  const rightSpireText = scene.add.text(780, 60, 'R Spire: 0 Floors', textStyle).setOrigin(1, 0);
  uiElements.push(rightSpireText);

  // Day Night Text
  const dayNightText = scene.add.text(400, 50, 'Day 1 - Dawn', { fontSize: '18px', color: '#fff', backgroundColor: '#0008' }).setOrigin(0.5, 0);
  uiElements.push(dayNightText);

  // Ensure HUD is above game entities
  uiElements.forEach(el => {
    // Scroll factor 0 so it sticks to camera
    if ('setScrollFactor' in el) {
      (el as Phaser.GameObjects.Text | Phaser.GameObjects.Rectangle).setScrollFactor(0);
    }
    (el as any).setDepth(100);
  });

  return (world: IWorld, _delta: number): IWorld => {
    // 0. Update Day Night Cycle
    const cycleEids = dayNightQuery(world);
    if (cycleEids.length > 0) {
        const eid = cycleEids[0];
        const dayNum = DayNightCycle.dayNumber[eid];
        const isNight = DayNightCycle.isNight[eid] === 1;
        dayNightText.setText(`Day ${dayNum} - ${isNight ? 'Nightfall' : 'Dawn'}`);
    }
    // 1. Update Core Energy
    const cores = coreQuery(world);
    if (cores.length > 0) {
      const coreEid = cores[0];
      const energy = CampCoreComponent.lightEnergy[coreEid];
      const max = CampCoreComponent.maxEnergy[coreEid];
      coreEnergyText.setText(formatEnergyText(energy, max));
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
