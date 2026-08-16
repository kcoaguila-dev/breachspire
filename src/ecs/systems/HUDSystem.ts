import { defineQuery, IWorld } from "bitecs";
import { CampCoreComponent, DayNightCycle, CoopStateComponent } from "../components";
import { formatEnergyText } from "../../ui/HUDState";
import Phaser from "phaser";

const coreQuery = defineQuery([CampCoreComponent]);
const dayNightQuery = defineQuery([DayNightCycle]);
const coopQuery = defineQuery([CoopStateComponent]);

export function createHUDSystem(scene: Phaser.Scene) {
  // Setup Phaser UI elements
  // We'll place HUD at the top/sides
  const uiElements: Phaser.GameObjects.GameObject[] = [];

  // Core Energy Text
  const coreEnergyText = scene.add.text(400, 20, 'Energy: 0/0', { fontSize: '20px', color: '#ffea00', backgroundColor: '#0008' }).setOrigin(0.5, 0);
  uiElements.push(coreEnergyText);

  // Coop Divider
  const screenWidth = scene.scale.width;
  const screenHeight = scene.scale.height;
  const dividerHeight = 8;
  const dividerY = (screenHeight / 2) - (dividerHeight / 2);
  const divider = scene.add.rectangle(screenWidth / 2, dividerY + dividerHeight / 2, screenWidth, dividerHeight, 0x4a4a4a);
  divider.setStrokeStyle(2, 0x2c2c2c);
  divider.setVisible(false);
  uiElements.push(divider);

  // Day Night Text
  const dayNightText = scene.add.text(scene.scale.width - 120, 30, '☀️ Day 1', { fontSize: '18px', color: '#fff', backgroundColor: '#0008' }).setOrigin(0, 0);
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
    // Check Coop state for Divider visibility
    const coops = coopQuery(world);
    let isCoopActive = false;
    if (coops.length > 0) {
      isCoopActive = CoopStateComponent.isCoopActive[coops[0]] === 1;
    }
    divider.setVisible(isCoopActive);

    // 0. Update Day Night Cycle
    const cycleEids = dayNightQuery(world);
    if (cycleEids.length > 0) {
        const eid = cycleEids[0];
        const dayNum = DayNightCycle.dayNumber[eid];
        const isNight = DayNightCycle.isNight[eid] === 1;
        dayNightText.setText(isNight ? `🌙 Night ${dayNum}` : `☀️ Day ${dayNum}`);
    }
    // 1. Update Core Energy
    const cores = coreQuery(world);
    if (cores.length > 0) {
      const coreEid = cores[0];
      const energy = CampCoreComponent.lightEnergy[coreEid];
      const max = CampCoreComponent.maxEnergy[coreEid];
      coreEnergyText.setText(formatEnergyText(energy, max));
    }

    return world;
  };
}
