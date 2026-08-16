import { defineQuery, IWorld } from "bitecs";
import { PlayerControlled, Position, Health, CoopStateComponent } from "../components";
import Phaser from "phaser";

const playerQuery = defineQuery([PlayerControlled, Position]);
const coopQuery = defineQuery([CoopStateComponent]);

export function createSplitCameraSystem(scene: Phaser.Scene) {
  const lerpFactor = 0.1; // Adjust for smoothness

  let p2Camera: Phaser.Cameras.Scene2D.Camera | null = null;
  const originalWidth = scene.cameras.main.width;

  return (world: IWorld, _delta: number): IWorld => {
    const players = playerQuery(world);
    const coops = coopQuery(world);

    if (players.length === 0) return world;

    let isCoopActive = false;

    if (coops.length > 0) {
      const coopEid = coops[0];
      isCoopActive = CoopStateComponent.isCoopActive[coopEid] === 1;
    }

    // Find players by query if IDs match or fallback
    let actualP1Eid = -1;
    let actualP2Eid = -1;

    for (let i = 0; i < players.length; i++) {
        const eid = players[i];
        if (PlayerControlled.playerId[eid] === 1) {
            actualP1Eid = eid;
        } else if (PlayerControlled.playerId[eid] === 2) {
            actualP2Eid = eid;
        }
    }

    // Default to query array if we didn't match via playerId
    if (actualP1Eid === -1 && players.length > 0) actualP1Eid = players[0];

    const cam1 = scene.cameras.main;

    if (isCoopActive && actualP1Eid !== -1 && actualP2Eid !== -1) {
      // Split Screen Active
      if (cam1.width !== originalWidth / 2) {
          cam1.setSize(originalWidth / 2, cam1.height);
      }

      if (!p2Camera) {
        p2Camera = scene.cameras.add(originalWidth / 2, 0, originalWidth / 2, cam1.height);
        p2Camera.setBounds(0, 0, 3200, 1200);
      }

      // Update Cam1 (Player 1)
      if (Health.current[actualP1Eid] > 0) {
        const targetX = Position.x[actualP1Eid];
        const targetY = Position.y[actualP1Eid];
        cam1.scrollX = Phaser.Math.Linear(cam1.scrollX, targetX - cam1.width / 2, lerpFactor);
        cam1.scrollY = Phaser.Math.Linear(cam1.scrollY, targetY - cam1.height / 2, lerpFactor);
      }

      // Update Cam2 (Player 2)
      if (Health.current[actualP2Eid] > 0 && p2Camera) {
        const targetX = Position.x[actualP2Eid];
        const targetY = Position.y[actualP2Eid];
        p2Camera.scrollX = Phaser.Math.Linear(p2Camera.scrollX, targetX - p2Camera.width / 2, lerpFactor);
        p2Camera.scrollY = Phaser.Math.Linear(p2Camera.scrollY, targetY - p2Camera.height / 2, lerpFactor);
      }

    } else {
      // Solo Screen Active
      if (cam1.width !== originalWidth) {
        cam1.setSize(originalWidth, cam1.height);
      }
      if (p2Camera) {
        scene.cameras.remove(p2Camera);
        p2Camera = null;
      }

      if (actualP1Eid !== -1 && Health.current[actualP1Eid] > 0) {
        const targetX = Position.x[actualP1Eid];
        const targetY = Position.y[actualP1Eid];
        cam1.scrollX = Phaser.Math.Linear(cam1.scrollX, targetX - cam1.width / 2, lerpFactor);
        cam1.scrollY = Phaser.Math.Linear(cam1.scrollY, targetY - cam1.height / 2, lerpFactor);
      }
    }

    return world;
  };
}
