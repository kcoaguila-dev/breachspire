import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { DemoScene } from "./scenes/DemoScene";

// Phaser 4.x — WebGL-only (Canvas is deprecated in v4).
// Physics is intentionally omitted: all movement is owned by bitECS MovementSystem.
// Adding Phaser's physics system here would be dead weight.
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  width: 800,
  height: 600,
  backgroundColor: "#1a1a2e",
  parent: "game-container",
  scene: [BootScene, DemoScene],
};

new Phaser.Game(config);