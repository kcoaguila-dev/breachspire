import { defineQuery, IWorld } from "bitecs";
import { PlayerControlled, InputStateComponent, Velocity, Speed, Health } from "../components";

const playerQuery = defineQuery([PlayerControlled, InputStateComponent, Velocity, Speed, Health]);

// Pure logic for testing
export function computeSprintVelocity(
  input: { left: boolean; right: boolean; up: boolean; down: boolean; isSprinting: boolean },
  baseSpeed: number,
  sprintMultiplier: number
): { vx: number; vy: number } {
  let dx = 0;
  let dy = 0;

  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;

  const currentSpeed = input.isSprinting ? baseSpeed * sprintMultiplier : baseSpeed;

  if (dx !== 0 && dy !== 0) {
    const length = Math.sqrt(dx * dx + dy * dy);
    dx /= length;
    dy /= length;
  }

  return { vx: dx * currentSpeed, vy: dy * currentSpeed };
}

export function computeCoopInput(
  p1Input: { left: boolean; right: boolean; up: boolean; down: boolean; isSprinting: boolean },
  p2Input: { left: boolean; right: boolean; up: boolean; down: boolean; isSprinting: boolean },
  p1Speed: number,
  p2Speed: number,
  sprintMultiplier: number
): { p1Velocity: { vx: number; vy: number }; p2Velocity: { vx: number; vy: number } } {
  return {
    p1Velocity: computeSprintVelocity(p1Input, p1Speed, sprintMultiplier),
    p2Velocity: computeSprintVelocity(p2Input, p2Speed, sprintMultiplier),
  };
}

export function createPlayerInputSystem(
  cursors: Phaser.Types.Input.Keyboard.CursorKeys,
  wasd: any,
  spaceKey: Phaser.Input.Keyboard.Key,
  numpad0Key: Phaser.Input.Keyboard.Key,
  enterKey: Phaser.Input.Keyboard.Key,
  shiftKey: Phaser.Input.Keyboard.Key,
  numpadEnterKey: Phaser.Input.Keyboard.Key,
  rightShiftKey: Phaser.Input.Keyboard.Key
) {
  const SPRINT_MULTIPLIER = 380 / 220; // 1.727

  return (world: IWorld, _delta: number): IWorld => {
    const entities = playerQuery(world);

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      if (Health.current[eid] <= 0) continue;

      const playerId = PlayerControlled.playerId[eid];

      let left = false, right = false, up = false, down = false, attack = false, isSprinting = false;

      if (playerId === 1) {
        left = wasd.A.isDown;
        right = wasd.D.isDown;
        up = wasd.W.isDown;
        down = wasd.S.isDown;
        attack = spaceKey.isDown;
        isSprinting = shiftKey.isDown;
      } else if (playerId === 2) {
        left = cursors.left.isDown;
        right = cursors.right.isDown;
        up = cursors.up.isDown;
        down = cursors.down.isDown;
        attack = numpad0Key.isDown || enterKey.isDown;
        isSprinting = numpadEnterKey.isDown || rightShiftKey.isDown;
      }

      InputStateComponent.left[eid] = left ? 1 : 0;
      InputStateComponent.right[eid] = right ? 1 : 0;
      InputStateComponent.up[eid] = up ? 1 : 0;
      InputStateComponent.down[eid] = down ? 1 : 0;
      InputStateComponent.attack[eid] = attack ? 1 : 0;
      InputStateComponent.isSprinting[eid] = isSprinting ? 1 : 0;

      const speed = Speed.value[eid];
      const { p1Velocity } = computeCoopInput(
        { left, right, up, down, isSprinting },
        { left: false, right: false, up: false, down: false, isSprinting: false },
        speed, 0, SPRINT_MULTIPLIER
      );

      Velocity.x[eid] = p1Velocity.vx;
      Velocity.y[eid] = p1Velocity.vy;
    }

    return world;
  };
}
