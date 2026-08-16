import Phaser from "phaser";
import { TextureGenerator } from "../gfx/TextureGenerator";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    // Preload minimal assets if needed.
  }

  create() {
    TextureGenerator.generateAll(this);
    this.scene.start("TitleScene");
  }
}
