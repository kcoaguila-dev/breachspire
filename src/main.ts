import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { TitleScene } from "./scenes/TitleScene";
import { UpgradeShopScene } from "./scenes/UpgradeShopScene";
import { DemoScene } from "./scenes/DemoScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  pixelArt: true,
  backgroundColor: "#08090d",
  parent: "game-container",
  scene: [BootScene, TitleScene, UpgradeShopScene, DemoScene],
};

new Phaser.Game(config);
