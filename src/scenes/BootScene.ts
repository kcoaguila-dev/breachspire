import Phaser from "phaser";
import { TextureGenerator } from "../gfx/TextureGenerator";

// Target pixel size for each sprite after downsampling.
// Deliberately small so pixelArt:true nearest-neighbour upscale gives chunky pixels.
const SPRITE_DEFS: { key: string; file: string; px: number; removeBg: boolean }[] = [
  { key: "unit_knight",          file: "/sprites/px_knight.jpg",    px: 48, removeBg: true  },
  { key: "unit_archer",          file: "/sprites/px_archer.jpg",    px: 48, removeBg: true  },
  { key: "unit_mage",            file: "/sprites/px_mage.jpg",      px: 48, removeBg: true  },
  { key: "unit_valkyrie",        file: "/sprites/px_valkyrie.jpg",  px: 48, removeBg: true  },
  { key: "steed_commander",      file: "/sprites/px_commander.jpg", px: 64, removeBg: true  },
  { key: "unit_goblin",          file: "/sprites/px_goblin.jpg",    px: 40, removeBg: true  },
  { key: "unit_troll",           file: "/sprites/px_troll.jpg",     px: 64, removeBg: true  },
  { key: "unit_cultist",         file: "/sprites/px_cultist.jpg",   px: 40, removeBg: true  },
  // Crystal keeps its dark background – it's the centrepiece scene art
  { key: "light_aether_crystal", file: "/sprites/light_aether_crystal.jpg", px: 128, removeBg: false },
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    for (const def of SPRITE_DEFS) {
      this.load.image(`${def.key}_raw`, def.file);
    }
  }

  create() {
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
   * of the corner color to fully transparent.  This removes the checker/solid
   * background that AI image generators bake into JPGs.
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

    // Tolerance: two pixels are "same background" if their absolute channel
    // sum difference is below this value.  Generous to handle JPG artefacts.
    const TOLERANCE = 60 * 3;

    // Seed from all four corners so we catch both checker colours
    const corners = [0, w - 1, (h - 1) * w, (h - 1) * w + w - 1];
    // Collect the seed colours
    const seedColors: [number, number, number][] = corners.map(pos => {
      const i = pos * 4;
      return [px[i], px[i + 1], px[i + 2]];
    });

    const isBg = (r: number, g: number, b: number): boolean => {
      for (const [sr, sg, sb] of seedColors) {
        if (Math.abs(r - sr) + Math.abs(g - sg) + Math.abs(b - sb) < TOLERANCE) {
          return true;
        }
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

      // Make transparent
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
