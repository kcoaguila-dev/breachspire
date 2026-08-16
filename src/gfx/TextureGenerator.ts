import Phaser from "phaser";

export function generateTextures(scene: Phaser.Scene) {
  const textures = [
    // Environments
    { key: "bg_sky", width: 1280, height: 720, color: "#111827", draw: drawRect },
    { key: "bg_mountains", width: 1280, height: 400, color: "#1f2937", draw: drawMountains },
    { key: "bg_pines", width: 1280, height: 200, color: "#064e3b", draw: drawPines },
    { key: "ground_cobble", width: 1280, height: 200, color: "#4b5563", draw: drawCobble },
    { key: "ladder_wood", width: 32, height: 128, color: "#78350f", draw: drawLadder },

    // Camp
    { key: "camp_core_hearth", width: 64, height: 64, color: "#f59e0b", draw: drawCore },
    { key: "camp_banner_flag", width: 32, height: 64, color: "#dc2626", draw: drawRect },
    { key: "wall_wood_palisade", width: 32, height: 128, color: "#92400e", draw: drawRect },
    { key: "wall_stone_battlement", width: 32, height: 128, color: "#6b7280", draw: drawRect },
    { key: "watchtower_post", width: 32, height: 64, color: "#78350f", draw: drawRect },

    // Spire
    { key: "spire_stone_arch", width: 64, height: 64, color: "#374151", draw: drawRect },
    { key: "spire_floor_plank", width: 64, height: 16, color: "#500724", draw: drawRect },
    { key: "spire_iron_portcullis", width: 32, height: 64, color: "#9ca3af", draw: drawRect },
    { key: "spire_dark_crystal", width: 48, height: 48, color: "#c026d3", draw: drawCrystal },

    // Characters
    { key: "unit_knight", width: 32, height: 32, color: "#3b82f6", draw: drawCharacter },
    { key: "unit_archer", width: 32, height: 32, color: "#22c55e", draw: drawCharacter },
    { key: "unit_mage", width: 32, height: 32, color: "#a855f7", draw: drawCharacter },
    { key: "unit_valkyrie", width: 32, height: 32, color: "#facc15", draw: drawCharacter },
    { key: "unit_commander", width: 32, height: 32, color: "#facc15", draw: drawCharacter },
    { key: "unit_warrior", width: 32, height: 32, color: "#ef4444", draw: drawCharacter },

    // Monsters
    { key: "unit_goblin", width: 32, height: 32, color: "#166534", draw: drawCharacter },
    { key: "unit_troll", width: 48, height: 48, color: "#14532d", draw: drawCharacter },
    { key: "unit_dark_archer", width: 32, height: 32, color: "#4c1d95", draw: drawCharacter },
    { key: "unit_cultist", width: 32, height: 32, color: "#701a75", draw: drawCharacter },
  ];

  textures.forEach((t) => {
    if (!scene.textures.exists(t.key)) {
      const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
      t.draw(graphics, t.width, t.height, Phaser.Display.Color.HexStringToColor(t.color).color);
      graphics.generateTexture(t.key, t.width, t.height);
      graphics.destroy();
    }
  });
}

function drawRect(g: Phaser.GameObjects.Graphics, w: number, h: number, color: number) {
  g.fillStyle(color, 1);
  g.fillRect(0, 0, w, h);
}

function drawMountains(g: Phaser.GameObjects.Graphics, w: number, h: number, color: number) {
  g.fillStyle(color, 1);
  g.beginPath();
  g.moveTo(0, h);
  g.lineTo(w * 0.2, h * 0.4);
  g.lineTo(w * 0.5, h * 0.8);
  g.lineTo(w * 0.8, h * 0.2);
  g.lineTo(w, h * 0.6);
  g.lineTo(w, h);
  g.closePath();
  g.fillPath();
}

function drawPines(g: Phaser.GameObjects.Graphics, w: number, h: number, color: number) {
  g.fillStyle(color, 1);
  for (let i = 0; i < 20; i++) {
    const px = Math.random() * w;
    const ph = h * 0.5 + Math.random() * h * 0.5;
    g.beginPath();
    g.moveTo(px, h);
    g.lineTo(px - 20, h);
    g.lineTo(px, h - ph);
    g.lineTo(px + 20, h);
    g.closePath();
    g.fillPath();
  }
}

function drawCobble(g: Phaser.GameObjects.Graphics, w: number, h: number, color: number) {
  g.fillStyle(color, 1);
  g.fillRect(0, 0, w, h);
  g.lineStyle(2, 0x1f2937, 1);
  for (let i = 0; i < w; i += 40) {
    for (let j = 0; j < h; j += 20) {
      g.strokeRect(i + (j % 40 === 0 ? 0 : 20), j, 40, 20);
    }
  }
}

function drawLadder(g: Phaser.GameObjects.Graphics, w: number, h: number, color: number) {
  g.fillStyle(color, 1);
  g.fillRect(0, 0, 4, h);
  g.fillRect(w - 4, 0, 4, h);
  for (let y = 10; y < h; y += 20) {
    g.fillRect(0, y, w, 4);
  }
}

function drawCore(g: Phaser.GameObjects.Graphics, w: number, h: number, color: number) {
  g.fillStyle(color, 1);
  g.fillCircle(w / 2, h / 2, w / 2);
  g.fillStyle(0xffffff, 0.5);
  g.fillCircle(w / 2, h / 2, w / 4);
}

function drawCrystal(g: Phaser.GameObjects.Graphics, w: number, h: number, color: number) {
  g.fillStyle(color, 1);
  g.beginPath();
  g.moveTo(w / 2, 0);
  g.lineTo(w, h / 2);
  g.lineTo(w / 2, h);
  g.lineTo(0, h / 2);
  g.closePath();
  g.fillPath();
}

function drawCharacter(g: Phaser.GameObjects.Graphics, w: number, h: number, color: number) {
  g.fillStyle(color, 1);
  g.fillRect(w * 0.25, h * 0.25, w * 0.5, h * 0.5); // body
  g.fillStyle(0xffffff, 1);
  g.fillRect(w * 0.6, h * 0.3, 4, 4); // eye
}