import { defineQuery, IWorld, enterQuery, removeEntity } from "bitecs";
import { DamageTextEvent, ScreenAlertComponent, DestructionEvent, CombatTypeValues } from "../components";
import type { AudioManager } from "../../audio/AudioManager";
import Phaser from "phaser";

const damageEventQuery = defineQuery([DamageTextEvent]);
const damageEventEnterQuery = enterQuery(damageEventQuery);

const alertQuery = defineQuery([ScreenAlertComponent]);

const destructionEventQuery = defineQuery([DestructionEvent]);
const destructionEventEnterQuery = enterQuery(destructionEventQuery);

import { CampWallComponent, Health, SpireSideValues } from "../components";
const wallQuery = defineQuery([CampWallComponent, Health]);

// ─────────────────────────────────────────────────────
// EXPORTED PURE LOGIC
// ─────────────────────────────────────────────────────

export function evaluateFlankDanger(leftWallHp: number, leftWallMax: number, rightWallHp: number, rightWallMax: number): { leftDanger: boolean; rightDanger: boolean } {
  const leftDanger = (leftWallHp / leftWallMax) < 0.25;
  const rightDanger = (rightWallHp / rightWallMax) < 0.25;
  return { leftDanger, rightDanger };
}

export function computeDamageTextColor(multiplier: number): string {
  if (multiplier > 1.0) return "#FFD700"; // Golden for advantage
  if (multiplier < 1.0) return "#AAAAAA"; // Muted for disadvantage
  return "#FFFFFF"; // White for neutral
}

// ─────────────────────────────────────────────────────
// SYSTEM FACTORY
// ─────────────────────────────────────────────────────

export function createCombatFeedbackSystem(scene: Phaser.Scene, audio: AudioManager) {
  // Vignettes
  const leftVignette = scene.add.rectangle(0, 0, 150, 1080, 0xff0000, 0.3).setOrigin(0, 0).setScrollFactor(0);
  const rightVignette = scene.add.rectangle(1920 - 150, 0, 150, 1080, 0xff0000, 0.3).setOrigin(0, 0).setScrollFactor(0);

  leftVignette.setVisible(false);
  rightVignette.setVisible(false);

  // Simple tween for pulsing vignette
  scene.tweens.add({
    targets: [leftVignette, rightVignette],
    alpha: { from: 0.1, to: 0.4 },
    duration: 500,
    yoyo: true,
    repeat: -1
  });

  return (world: IWorld, _delta: number): IWorld => {
    // Process Damage Events
    const damageEvents = damageEventEnterQuery(world);
    for (let i = 0; i < damageEvents.length; i++) {
      const eid = damageEvents[i];
      const x = DamageTextEvent.targetX[eid];
      const y = DamageTextEvent.targetY[eid];
      const amt = DamageTextEvent.amount[eid];
      const isAdv = DamageTextEvent.isAdvantage[eid]; // 0=disadvantage, 1=neutral, 2=advantage
      const combatType = DamageTextEvent.combatType[eid];

      // Audio
      if (combatType === CombatTypeValues.Melee) {
          audio.playSlash();
      } else if (combatType === CombatTypeValues.Ranged) {
          audio.playArrow();
      }

      let mult = 1.0;
      if (isAdv === 0) mult = 0.5;
      else if (isAdv === 2) mult = 1.5;

      const color = computeDamageTextColor(mult);
      const fontSize = mult > 1.0 ? '24px' : '16px';

      // Create floating text
      const text = scene.add.text(x, y - 20, Math.floor(amt).toString(), {
        color: color,
        fontSize: fontSize,
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);

      // Tween floating text up and fade out
      scene.tweens.add({
        targets: text,
        y: y - 50,
        alpha: 0,
        duration: 1000,
        onComplete: () => text.destroy()
      });

      // Cleanup event entity immediately
      removeEntity(world, eid);
    }

    // Process Destruction Events
    const destructionEvents = destructionEventEnterQuery(world);
    for (let i = 0; i < destructionEvents.length; i++) {
        const eid = destructionEvents[i];
        const x = DestructionEvent.x[eid];
        const y = DestructionEvent.y[eid];
        const type = DestructionEvent.type[eid];

        // Trigger ScreenAlert Shake
        const alerts = alertQuery(world);
        if (alerts.length > 0) {
            ScreenAlertComponent.shakeIntensity[alerts[0]] = type === 0 ? 10 : 15; // 0=Floor, 1=Wall
        }

        // VFX
        // Using a built-in particle since 'dust' texture might not exist, using a rectangle texture or similar
        // For now, let's just create some simple squares to simulate particles
        for(let p=0; p<10; p++) {
            const rect = scene.add.rectangle(x, y, 8, 8, 0x888888);
            scene.tweens.add({
                targets: rect,
                x: x + (Math.random() - 0.5) * 100,
                y: y + (Math.random() - 0.5) * 100,
                alpha: 0,
                duration: 500 + Math.random() * 500,
                onComplete: () => rect.destroy()
            });
        }

        removeEntity(world, eid);
    }

    // Update Flank Danger
    let leftWallHp = 0, leftWallMax = 1, rightWallHp = 0, rightWallMax = 1;
    const walls = wallQuery(world);
    for (let i = 0; i < walls.length; i++) {
        const wallEid = walls[i];
        if (CampWallComponent.side[wallEid] === SpireSideValues.Left) {
            leftWallHp = Health.current[wallEid] || 0;
            leftWallMax = CampWallComponent.maxHp[wallEid] || 1;
        } else if (CampWallComponent.side[wallEid] === SpireSideValues.Right) {
            rightWallHp = Health.current[wallEid] || 0;
            rightWallMax = CampWallComponent.maxHp[wallEid] || 1;
        }
    }

    const { leftDanger: checkLeft, rightDanger: checkRight } = evaluateFlankDanger(leftWallHp, leftWallMax, rightWallHp, rightWallMax);

    // Process Screen Alerts
    const alerts = alertQuery(world);
    for (let i = 0; i < alerts.length; i++) {
        const eid = alerts[i];

        ScreenAlertComponent.leftFlankDanger[eid] = checkLeft ? 1 : 0;
        ScreenAlertComponent.rightFlankDanger[eid] = checkRight ? 1 : 0;

        // Flank Danger UI
        const leftDanger = ScreenAlertComponent.leftFlankDanger[eid] === 1;
        const rightDanger = ScreenAlertComponent.rightFlankDanger[eid] === 1;

        leftVignette.setVisible(leftDanger);
        rightVignette.setVisible(rightDanger);

        // Shake
        const shake = ScreenAlertComponent.shakeIntensity[eid];
        if (shake > 0) {
            scene.cameras.main.shake(200, shake * 0.01);

            // Audio hooks
            if (shake > 5) {
                audio.playCollapse();
            } else {
                audio.playWallHit();
            }

            // Reset shake intensity after consuming
            ScreenAlertComponent.shakeIntensity[eid] = 0;
        }
    }

    return world;
  };
}
