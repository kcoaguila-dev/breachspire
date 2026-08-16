import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { TitleScene } from "./scenes/TitleScene";
import { UpgradeShopScene } from "./scenes/UpgradeShopScene";
import { DemoScene } from "./scenes/DemoScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  width: 800,
  height: 600,
  backgroundColor: "#1a1a2e",
  parent: "game-container",
  scene: [BootScene, TitleScene, UpgradeShopScene, DemoScene],
};

new Phaser.Game(config);
