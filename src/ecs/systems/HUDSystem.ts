import { defineQuery, IWorld, hasComponent } from "bitecs";
import { CampCoreComponent, DayNightCycle, CoopStateComponent, CampStockComponent, PlayerControlled } from "../components";
import { formatResourceHUDText, formatCoopEnergyHUDText } from "../../ui/HUDState";
import Phaser from "phaser";

const coreQuery = defineQuery([CampCoreComponent]);
const dayNightQuery = defineQuery([DayNightCycle]);
const coopQuery = defineQuery([CoopStateComponent]);
const playerQuery = defineQuery([PlayerControlled]);

export function createHUDSystem(scene: Phaser.Scene) {
  // Setup Phaser UI elements
  const uiElements: Phaser.GameObjects.GameObject[] = [];

  // Core Energy & Resources Text: Top-Left, crisp arcade pixel font, sharp black outline, NO background shadow box
  const coreEnergyText = scene.add.text(30, 20, '⚡ Energy: 0/0  |  🪵 Wood: 0  |  ⛏️ Iron: 0', {
    fontSize: '18px',
    fontFamily: 'monospace',
    color: '#ffea00',
    stroke: '#000000',
    strokeThickness: 3
  }).setOrigin(0, 0);
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

  // Day Night Text: Top-Right, crisp arcade pixel font, sharp black outline, NO background shadow box
  const dayNightText = scene.add.text(scene.scale.width - 30, 20, '☀️ Day 1', {
    fontSize: '18px',
    fontFamily: 'monospace',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 3
  }).setOrigin(1, 0);
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

    // 1. Update Energy & Resources
    const cores = coreQuery(world);
    const players = playerQuery(world);

    let wood = 0;
    let iron = 0;
    let maxWood = 20;
    let maxIron = 10;

    if (cores.length > 0) {
      const coreEid = cores[0];
      if (hasComponent(world, CampStockComponent, coreEid)) {
        wood = CampStockComponent.wood[coreEid];
        iron = CampStockComponent.iron[coreEid];
        maxWood = CampStockComponent.maxWood[coreEid] || 20;
        maxIron = CampStockComponent.maxIron[coreEid] || 10;
      }
    }

    if (isCoopActive && players.length >= 2) {
      let p1Eid = -1;
      let p2Eid = -1;
      for (let i = 0; i < players.length; i++) {
        if (PlayerControlled.playerId[players[i]] === 1) p1Eid = players[i];
        if (PlayerControlled.playerId[players[i]] === 2) p2Eid = players[i];
      }

      if (p1Eid !== -1 && p2Eid !== -1) {
        const p1Energy = PlayerControlled.energy[p1Eid];
        const p1Max = PlayerControlled.maxEnergy[p1Eid] || 50;
        const p1Down = PlayerControlled.isDowned[p1Eid] === 1;

        const p2Energy = PlayerControlled.energy[p2Eid];
        const p2Max = PlayerControlled.maxEnergy[p2Eid] || 50;
        const p2Down = PlayerControlled.isDowned[p2Eid] === 1;

        coreEnergyText.setText(formatCoopEnergyHUDText(
          p1Energy, p1Max, p1Down,
          p2Energy, p2Max, p2Down,
          wood, iron, maxWood, maxIron
        ));
        return world;
      }
    }

    // Single Player Display
    let playerEnergy = 0;
    let playerMaxEnergy = 50;
    if (players.length > 0) {
      playerEnergy = PlayerControlled.energy[players[0]] || 0;
      playerMaxEnergy = PlayerControlled.maxEnergy[players[0]] || 50;
    } else if (cores.length > 0) {
      playerEnergy = CampCoreComponent.lightEnergy[cores[0]];
      playerMaxEnergy = CampCoreComponent.maxEnergy[cores[0]];
    }

    coreEnergyText.setText(formatResourceHUDText(playerEnergy, playerMaxEnergy, wood, iron, maxWood, maxIron));
    return world;
  };
}
