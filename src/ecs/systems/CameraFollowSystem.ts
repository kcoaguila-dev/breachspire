import { defineQuery, IWorld } from "bitecs";
import { PlayerControlled, Position, Health } from "../components";
import Phaser from "phaser";

const playerQuery = defineQuery([PlayerControlled, Position]);

export function createCameraFollowSystem(scene: Phaser.Scene) {
  const lerpFactor = 0.1; // Adjust for smoothness

  return (world: IWorld, _delta: number): IWorld => {
    const entities = playerQuery(world);

    if (entities.length === 0) return world;

    // Follow the first player-controlled entity
    const eid = entities[0];

    // Dead entity guard (optional for camera, but good practice if player dies)
    if (Health.current[eid] <= 0) return world;

    const targetX = Position.x[eid];
    const targetY = Position.y[eid];

    const camera = scene.cameras.main;

    // Smoothly lerp camera center to player position
    camera.scrollX = Phaser.Math.Linear(camera.scrollX, targetX - camera.width / 2, lerpFactor);
    camera.scrollY = Phaser.Math.Linear(camera.scrollY, targetY - camera.height / 2, lerpFactor);

    return world;
  };
}
