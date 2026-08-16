import Phaser from "phaser";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    this.add.text(centerX, centerY - 100, "Breachspire", {
      fontSize: "64px",
      color: "#ffea00",
      fontStyle: "bold"
    }).setOrigin(0.5);

    const startBtn = this.add.text(centerX, centerY, "Start Raid", {
      fontSize: "32px",
      color: "#ffffff",
      backgroundColor: "#333333",
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on('pointerdown', () => {
      this.scene.start("DemoScene");
    });
    startBtn.on('pointerover', () => startBtn.setStyle({ color: '#ffea00' }));
    startBtn.on('pointerout', () => startBtn.setStyle({ color: '#ffffff' }));

    const upgradesBtn = this.add.text(centerX, centerY + 80, "Camp Upgrades", {
      fontSize: "32px",
      color: "#ffffff",
      backgroundColor: "#333333",
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    upgradesBtn.on('pointerdown', () => {
      this.scene.start("UpgradeShopScene");
    });
    upgradesBtn.on('pointerover', () => upgradesBtn.setStyle({ color: '#ffea00' }));
    upgradesBtn.on('pointerout', () => upgradesBtn.setStyle({ color: '#ffffff' }));
  }
}
