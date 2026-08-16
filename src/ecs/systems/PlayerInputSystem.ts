import { defineQuery, IWorld } from "bitecs";
import { PlayerControlled, InputStateComponent, Velocity, Speed, Health } from "../components";

const playerQuery = defineQuery([PlayerControlled, InputStateComponent, Velocity, Speed, Health]);

// Pure logic for testing
export function computePlayerVelocity(
  input: { left: boolean; right: boolean; up: boolean; down: boolean },
  speed: number
): { vx: number; vy: number } {
  let dx = 0;
  let dy = 0;

  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;

  // Normalize if diagonal
  if (dx !== 0 && dy !== 0) {
    const length = Math.sqrt(dx * dx + dy * dy);
    dx /= length;
    dy /= length;
  }

  return {
    vx: dx * speed,
    vy: dy * speed,
  };
}

export function createPlayerInputSystem(
  cursors: Phaser.Types.Input.Keyboard.CursorKeys,
  wasd: any,
  spaceKey: Phaser.Input.Keyboard.Key
) {
  return (world: IWorld, _delta: number): IWorld => {
    const entities = playerQuery(world);

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      if (Health.current[eid] <= 0) continue;

      const left = cursors.left.isDown || wasd.A.isDown;
      const right = cursors.right.isDown || wasd.D.isDown;
      const up = cursors.up.isDown || wasd.W.isDown;
      const down = cursors.down.isDown || wasd.S.isDown;
      const attack = spaceKey.isDown;

      InputStateComponent.left[eid] = left ? 1 : 0;
      InputStateComponent.right[eid] = right ? 1 : 0;
      InputStateComponent.up[eid] = up ? 1 : 0;
      InputStateComponent.down[eid] = down ? 1 : 0;
      InputStateComponent.attack[eid] = attack ? 1 : 0;

      const speed = Speed.value[eid];
      const { vx, vy } = computePlayerVelocity({ left, right, up, down }, speed);

      Velocity.x[eid] = vx;
      Velocity.y[eid] = vy;
    }

    return world;
  };
}
