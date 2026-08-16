import { defineQuery, IWorld } from "bitecs";
import { PlayerControlled, InputStateComponent, Velocity, Speed, Health, ClimbingState } from "../components";
import { hasComponent } from "bitecs";

const playerQuery = defineQuery([PlayerControlled, InputStateComponent, Velocity, Speed, Health]);

// Pure logic for testing
export function computeCoopInput(
  p1Input: { left: boolean; right: boolean; up: boolean; down: boolean },
  p2Input: { left: boolean; right: boolean; up: boolean; down: boolean },
  p1Speed: number,
  p2Speed: number
): { p1Velocity: { vx: number; vy: number }; p2Velocity: { vx: number; vy: number } } {
  const getVelocity = (input: { left: boolean; right: boolean; up: boolean; down: boolean }, speed: number) => {
    let dx = 0;
    let dy = 0;

    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;

    if (dx !== 0 && dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx /= length;
      dy /= length;
    }

    return { vx: dx * speed, vy: dy * speed };
  };

  return {
    p1Velocity: getVelocity(p1Input, p1Speed),
    p2Velocity: getVelocity(p2Input, p2Speed),
  };
}

export function createPlayerInputSystem(
  cursors: Phaser.Types.Input.Keyboard.CursorKeys,
  wasd: any,
  spaceKey: Phaser.Input.Keyboard.Key,
  numpad0Key: Phaser.Input.Keyboard.Key,
  enterKey: Phaser.Input.Keyboard.Key
) {
  return (world: IWorld, _delta: number): IWorld => {
    const entities = playerQuery(world);

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      if (Health.current[eid] <= 0) continue;

      const playerId = PlayerControlled.playerId[eid];

      let left = false, right = false, up = false, down = false, attack = false;

      if (playerId === 1) {
        left = wasd.A.isDown;
        right = wasd.D.isDown;
        up = wasd.W.isDown;
        down = wasd.S.isDown;
        attack = spaceKey.isDown;
      } else if (playerId === 2) {
        left = cursors.left.isDown;
        right = cursors.right.isDown;
        up = cursors.up.isDown;
        down = cursors.down.isDown;
        attack = numpad0Key.isDown || enterKey.isDown;
      }

      InputStateComponent.left[eid] = left ? 1 : 0;
      InputStateComponent.right[eid] = right ? 1 : 0;
      InputStateComponent.up[eid] = up ? 1 : 0;
      InputStateComponent.down[eid] = down ? 1 : 0;
      InputStateComponent.attack[eid] = attack ? 1 : 0;

      const speed = Speed.value[eid];
      const { p1Velocity } = computeCoopInput({ left, right, up, down }, { left: false, right: false, up: false, down: false }, speed, 0);

      Velocity.x[eid] = p1Velocity.vx;
      Velocity.y[eid] = p1Velocity.vy;

      if (hasComponent(world, ClimbingState, eid) && ClimbingState.isClimbing[eid] === 1) {
          // If climbing, ClimbingSystem will override velocity.
          // However, we want to ensure climbing system gets to handle it without gravity logic interference if we add gravity later.
      }
    }

    return world;
  };
}
