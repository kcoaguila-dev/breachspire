import Phaser from "phaser";
import { loadCampSaveState, saveCampSaveState } from "../persistence/RunStateManager";
import { loadCampUpgrades } from "../data/loader";
import { CampUpgrade } from "../data/schemas";
import { canPurchaseUpgrade } from "../ui/HUDState";

export class UpgradeShopScene extends Phaser.Scene {
  private saveState = loadCampSaveState();
  private upgrades: CampUpgrade[] = [];


  constructor() {
    super("UpgradeShopScene");
  }

  async create() {
    this.saveState = loadCampSaveState(); // reload just in case
    const centerX = this.cameras.main.width / 2;

    this.add.text(centerX, 50, "Camp Upgrades", {
      fontSize: "48px",
      color: "#ffea00",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.add.text(centerX, 100, `Available Aether: ${this.saveState.totalAetherEarned}`, {
      fontSize: "24px",
      color: "#ffffff"
    }).setOrigin(0.5);

    const backBtn = this.add.text(50, 50, "Back", {
      fontSize: "24px",
      color: "#ffffff",
      backgroundColor: "#333333",
      padding: { x: 10, y: 5 }
    }).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      this.scene.start("TitleScene");
    });
    backBtn.on('pointerover', () => backBtn.setStyle({ color: '#ffea00' }));
    backBtn.on('pointerout', () => backBtn.setStyle({ color: '#ffffff' }));

    try {
      this.upgrades = await loadCampUpgrades('/data/meta/camp_upgrades.json');
      this.renderUpgrades();
    } catch (e) {
      console.error("Failed to load upgrades:", e);
      this.add.text(centerX, 200, "Error loading upgrades", { color: "red" }).setOrigin(0.5);
    }
  }

  private renderUpgrades() {
    const startY = 150;
    const spacingY = 80;

    this.upgrades.forEach((upgrade, index) => {
      const y = startY + index * spacingY;
      const isUnlocked = this.saveState.unlockedUpgrades.includes(upgrade.id);
      const canBuy = canPurchaseUpgrade(upgrade.cost, this.saveState.totalAetherEarned, isUnlocked);

      this.add.text(100, y, `${upgrade.name} - ${upgrade.description}`, {
        fontSize: "18px",
        color: "#ffffff"
      });

      const statusText = isUnlocked ? "Unlocked" : `Cost: ${upgrade.cost}`;

      const btnColor = isUnlocked ? "#555555" : (canBuy ? "#00aa00" : "#aa0000");
      const btn = this.add.text(600, y, statusText, {
        fontSize: "18px",
        color: "#ffffff",
        backgroundColor: btnColor,
        padding: { x: 10, y: 5 }
      });

      if (canBuy) {
        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerdown', () => {
          this.purchase(upgrade);
        });
        btn.on('pointerover', () => btn.setStyle({ color: '#ffea00' }));
        btn.on('pointerout', () => btn.setStyle({ color: '#ffffff' }));
      }
    });
  }

  private purchase(upgrade: CampUpgrade) {
    if (!canPurchaseUpgrade(upgrade.cost, this.saveState.totalAetherEarned, this.saveState.unlockedUpgrades.includes(upgrade.id))) {
      return;
    }

    this.saveState.totalAetherEarned -= upgrade.cost;
    this.saveState.unlockedUpgrades.push(upgrade.id);
    saveCampSaveState(this.saveState);

    // Refresh UI
    this.scene.restart();
  }
}
