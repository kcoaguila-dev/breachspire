import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { TitleScene } from "./scenes/TitleScene";
import { UpgradeShopScene } from "./scenes/UpgradeShopScene";
import { GameScene } from "./scenes/GameScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  pixelArt: true,
  backgroundColor: "#08090d",
  parent: "game-container",
  scene: [BootScene, TitleScene, UpgradeShopScene, GameScene],
};

const game = new Phaser.Game(config);
(window as any).__PHASER_GAME__ = game;
