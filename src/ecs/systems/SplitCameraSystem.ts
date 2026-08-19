import { defineQuery, IWorld } from "bitecs";
import { PlayerControlled, Position, Health, CoopStateComponent } from "../components";
import Phaser from "phaser";

const playerQuery = defineQuery([PlayerControlled, Position]);
const coopQuery = defineQuery([CoopStateComponent]);

export function computeCameraViewports(screenWidth: number, screenHeight: number, isCoopActive: boolean) {
  if (isCoopActive) {
    return {
      cam1: { x: 0, y: 0, width: screenWidth, height: screenHeight / 2 },
      cam2: { x: 0, y: screenHeight / 2, width: screenWidth, height: screenHeight / 2 }
    };
  } else {
    return {
      cam1: { x: 0, y: 0, width: screenWidth, height: screenHeight },
      cam2: null
    };
  }
}

export function createSplitCameraSystem(scene: Phaser.Scene) {
  const lerpFactor = 0.1; // Adjust for smoothness

  let p2Camera: Phaser.Cameras.Scene2D.Camera | null = null;
  const originalWidth = scene.scale.width;
  const originalHeight = scene.scale.height;

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

    // Check if actual coop is fully active (both players are present)
    const fullyCoop = isCoopActive && actualP1Eid !== -1 && actualP2Eid !== -1;
    const viewports = computeCameraViewports(originalWidth, originalHeight, fullyCoop);

    if (fullyCoop) {
      // Split Screen Active — Top half (P1) and Bottom half (P2)
      if (cam1.height !== viewports.cam1.height || cam1.width !== viewports.cam1.width) {
        cam1.setSize(viewports.cam1.width, viewports.cam1.height);
        cam1.setViewport(viewports.cam1.x, viewports.cam1.y, viewports.cam1.width, viewports.cam1.height);
        cam1.setZoom(1.0);
      }

      if (!p2Camera && viewports.cam2) {
        p2Camera = scene.cameras.add(viewports.cam2.x, viewports.cam2.y, viewports.cam2.width, viewports.cam2.height);
        p2Camera.setBounds(0, 0, 32000, 1200);
        p2Camera.setZoom(1.0);
      } else if (p2Camera && viewports.cam2) {
        if (p2Camera.height !== viewports.cam2.height || p2Camera.width !== viewports.cam2.width) {
          p2Camera.setSize(viewports.cam2.width, viewports.cam2.height);
          p2Camera.setViewport(viewports.cam2.x, viewports.cam2.y, viewports.cam2.width, viewports.cam2.height);
          p2Camera.setZoom(1.0);
        }
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
      // Solo Screen Active — Full screen 1.0 zoom
      if (cam1.height !== viewports.cam1.height || cam1.width !== viewports.cam1.width) {
        cam1.setSize(viewports.cam1.width, viewports.cam1.height);
        cam1.setViewport(viewports.cam1.x, viewports.cam1.y, viewports.cam1.width, viewports.cam1.height);
        cam1.setZoom(1.0);
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
