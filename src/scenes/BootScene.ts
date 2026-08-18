import Phaser from "phaser";
import { TextureGenerator } from "../gfx/TextureGenerator";
import { ANIM_DEFS } from "../gfx/AnimationKeys";

// Target pixel size for each sprite after downsampling.
// Deliberately small so pixelArt:true nearest-neighbour upscale gives chunky pixels.
const SPRITE_DEFS: { key: string; file: string; px: number; removeBg: boolean }[] = [
  // Crystal keeps its dark background – it's the centrepiece scene art
  { key: "light_aether_crystal", file: "/sprites/light_aether_crystal.jpg", px: 128, removeBg: false },
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    // Static sprites (JPG, single-frame)
    for (const def of SPRITE_DEFS) {
      this.load.image(`${def.key}_raw`, def.file);
    }
    // Animation sprite sheets (PNG, multi-frame, black background)
    for (const def of ANIM_DEFS) {
      this.load.image(`${def.key}_raw`, def.file);
    }
  }

  create() {
    // Process static single-frame sprites
    for (const def of SPRITE_DEFS) {
      const canvas = this._downsample(`${def.key}_raw`, def.px, def.px);
      if (!canvas) continue;
      if (this.textures.exists(def.key)) {
        this.textures.remove(def.key);
      }
      this.textures.addCanvas(def.key, canvas);
    }

    // Process animation sprite sheets — load raw PNG, remove black bg, slice into frames
    for (const def of ANIM_DEFS) {
      const rawKey = `${def.key}_raw`;
      const src = this.textures.get(rawKey);
      if (!src) continue;

      const img = src.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
      const totalW = def.frameW * def.frames;

      const canvas = document.createElement("canvas");
      canvas.width  = totalW;
      canvas.height = def.frameH;
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      ctx.imageSmoothingEnabled = false;
      // Draw entire sheet (Phaser loaded the full PNG as a single image)
      ctx.drawImage(img as CanvasImageSource, 0, 0, totalW, def.frameH);

      // Remove solid-black background pixels (threshold: each channel < 30)
      const imgData = ctx.getImageData(0, 0, totalW, def.frameH);
      const px = imgData.data;
      for (let i = 0; i < px.length; i += 4) {
        if (px[i] < 30 && px[i + 1] < 30 && px[i + 2] < 30) {
          px[i + 3] = 0;
        }
      }
      ctx.putImageData(imgData, 0, 0);

      if (this.textures.exists(def.key)) {
        this.textures.remove(def.key);
      }
      const tex = this.textures.addCanvas(def.key, canvas);
      if (!tex) continue;

      // Register numeric frame indices so anims.generateFrameNumbers() works
      for (let f = 0; f < def.frames; f++) {
        tex.add(f, 0, f * def.frameW, 0, def.frameW, def.frameH);
      }
    }

    TextureGenerator.generateAll(this);
    this.scene.start("TitleScene");
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /** Draws srcKey onto a tiny canvas (nearest-neighbour) and returns it. */
  private _downsample(
    srcKey: string,
    w: number,
    h: number
  ): HTMLCanvasElement | null {
    const src = this.textures.get(srcKey);
    if (!src) return null;
    const img = src.getSourceImage() as HTMLImageElement | HTMLCanvasElement;

    const canvas = document.createElement("canvas");
    canvas.width  = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img as CanvasImageSource, 0, 0, w, h);
    return canvas;
  }

}
