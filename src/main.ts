import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { DemoScene } from "./scenes/DemoScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game-container",
  scene: [BootScene, DemoScene],
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
};

new Phaser.Game(config);