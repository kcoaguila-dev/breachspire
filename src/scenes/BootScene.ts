import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    // Preload minimal assets if needed.
  }

  create() {
    this.scene.start("TitleScene");
  }
}
