import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    // Preload minimal assets if needed.
    // We are mostly rendering primitives for this slice.
  }

  create() {
    this.scene.start("DemoScene");
  }
}