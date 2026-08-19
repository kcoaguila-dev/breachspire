import Phaser from "phaser";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    this.add.text(centerX, centerY - 130, "Breachspire", {
      fontSize: "64px",
      color: "#ffea00",
      fontStyle: "bold"
    }).setOrigin(0.5);

    const singleBtn = this.add.text(centerX, centerY - 10, "Single Player", {
      fontSize: "30px",
      color: "#ffffff",
      backgroundColor: "#2a2a2a",
      padding: { x: 32, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    singleBtn.on('pointerdown', () => {
      this.scene.start("GameScene", { coop: false });
    });
    singleBtn.on('pointerover', () => singleBtn.setStyle({ color: '#ffea00' }));
    singleBtn.on('pointerout', () => singleBtn.setStyle({ color: '#ffffff' }));

    const coopBtn = this.add.text(centerX, centerY + 65, "Two Players (Co-op)", {
      fontSize: "26px",
      color: "#ffffff",
      backgroundColor: "#2a2a2a",
      padding: { x: 24, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    coopBtn.on('pointerdown', () => {
      this.scene.start("GameScene", { coop: true });
    });
    coopBtn.on('pointerover', () => coopBtn.setStyle({ color: '#ffea00' }));
    coopBtn.on('pointerout', () => coopBtn.setStyle({ color: '#ffffff' }));

    const upgradesBtn = this.add.text(centerX, centerY + 130, "Camp Upgrades", {
      fontSize: "26px",
      color: "#ffffff",
      backgroundColor: "#2a2a2a",
      padding: { x: 24, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    upgradesBtn.on('pointerdown', () => {
      this.scene.start("UpgradeShopScene");
    });
    upgradesBtn.on('pointerover', () => upgradesBtn.setStyle({ color: '#ffea00' }));
    upgradesBtn.on('pointerout', () => upgradesBtn.setStyle({ color: '#ffffff' }));

    // Global canvas click fallback for E2E tests clicking canvas center
    this.input.keyboard?.once('keydown-SPACE', () => {
      this.scene.start("GameScene", { coop: false });
    });
    this.input.keyboard?.once('keydown-ENTER', () => {
      this.scene.start("GameScene", { coop: false });
    });
  }
}
