import Phaser from "phaser";
import { TextureGenerator } from "../gfx/TextureGenerator";
import { ANIM_DEFS } from "../gfx/AnimationKeys";

// Target pixel size for each sprite after downsampling.
// Deliberately small so pixelArt:true nearest-neighbour upscale gives chunky pixels.
const SPRITE_DEFS: { key: string; file: string; px: number; removeBg: boolean }[] = [
  { key: "unit_knight",          file: "/sprites/px_knight.jpg",    px: 48, removeBg: true  },
  { key: "unit_valkyrie",        file: "/sprites/px_valkyrie.jpg",  px: 48, removeBg: true  },
  { key: "steed_commander",      file: "/sprites/px_commander.jpg", px: 64, removeBg: true  },
  { key: "unit_archer",          file: "/sprites/px_archer.jpg",    px: 48, removeBg: true  },
  { key: "unit_mage",            file: "/sprites/px_mage.jpg",      px: 48, removeBg: true  },
  { key: "unit_goblin",          file: "/sprites/px_goblin.jpg",    px: 40, removeBg: true  },
  { key: "unit_troll",           file: "/sprites/px_troll.jpg",     px: 64, removeBg: true  },
  { key: "unit_cultist",         file: "/sprites/px_cultist.jpg",   px: 40, removeBg: true  },
  // Crystal is loaded from clean transparent PNG
  { key: "light_aether_crystal", file: "/sprites/light_aether_crystal.png", px: 128, removeBg: false },
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    // Static sprites (JPG characters + crystal)
    for (const def of SPRITE_DEFS) {
      this.load.image(`${def.key}_raw`, def.file);
    }
    // Animation sprite sheets (PNG, multi-frame transparent)
    for (const def of ANIM_DEFS) {
      this.load.spritesheet(def.key, def.file, {
        frameWidth: def.frameW,
        frameHeight: def.frameH,
      });
    }

    // Authentic Kingdom Two Crowns pixel art background & ground layers
    this.load.image("bg_forest_mist", "/sprites/bg_forest_mist.jpg");
    this.load.image("bg_ground_embankment", "/sprites/bg_ground_embankment.jpg");
  }

  create() {
    // Process static single-frame sprites (downsample & register)
    for (const def of SPRITE_DEFS) {
      const canvas = this._downsample(`${def.key}_raw`, def.px, def.px);
      if (!canvas) continue;
      if (def.removeBg) {
        this._floodFillRemoveBg(canvas);
      }
      if (this.textures.exists(def.key)) {
        this.textures.remove(def.key);
      }
      this.textures.addCanvas(def.key, canvas);
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

  /**
   * Flood-fills from all four corners, setting any pixel within color-tolerance
   * of the corner color to fully transparent. Removes checker/solid backgrounds
   * that AI image generators bake into JPGs.
   */
  private _floodFillRemoveBg(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const imageData = ctx.getImageData(0, 0, w, h);
    const px = imageData.data;

    const visited = new Uint8Array(w * h);
    const queue: number[] = [];

    const TOLERANCE = 60 * 3;
    const corners = [0, w - 1, (h - 1) * w, (h - 1) * w + w - 1];
    const seedColors: [number, number, number][] = corners.map(pos => {
      const i = pos * 4;
      return [px[i], px[i + 1], px[i + 2]];
    });

    const isBg = (r: number, g: number, b: number): boolean => {
      for (const [sr, sg, sb] of seedColors) {
        if (Math.abs(r - sr) + Math.abs(g - sg) + Math.abs(b - sb) < TOLERANCE) return true;
      }
      return false;
    };

    for (const startPos of corners) {
      if (!visited[startPos]) queue.push(startPos);
    }

    while (queue.length > 0) {
      const pos = queue.pop()!;
      if (visited[pos]) continue;
      visited[pos] = 1;

      const i = pos * 4;
      if (!isBg(px[i], px[i + 1], px[i + 2])) continue;

      px[i + 3] = 0;

      const x = pos % w;
      const y = Math.floor(pos / w);
      if (x > 0     && !visited[pos - 1]) queue.push(pos - 1);
      if (x < w - 1 && !visited[pos + 1]) queue.push(pos + 1);
      if (y > 0     && !visited[pos - w]) queue.push(pos - w);
      if (y < h - 1 && !visited[pos + w]) queue.push(pos + w);
    }

    ctx.putImageData(imageData, 0, 0);
  }
}
