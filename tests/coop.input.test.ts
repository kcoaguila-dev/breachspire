import { describe, it, expect } from 'vitest';
import { computeCoopInput } from '../src/ecs/systems/PlayerInputSystem';
import { canDropInPlayer2 } from '../src/ecs/systems/CoopSystem';

describe('Coop Input System', () => {
  it('should calculate independent velocities for Player 1 and Player 2', () => {
    const p1Input = { left: true, right: false, up: false, down: false }; // P1 moving left
    const p2Input = { left: false, right: true, up: false, down: false }; // P2 moving right

    const { p1Velocity, p2Velocity } = computeCoopInput(p1Input, p2Input, 100, 150);

    expect(p1Velocity.vx).toBe(-100);
    expect(p1Velocity.vy).toBe(0);

    expect(p2Velocity.vx).toBe(150);
    expect(p2Velocity.vy).toBe(0);
  });

  it('should normalize diagonal movement independently', () => {
    const p1Input = { left: true, right: false, up: true, down: false };
    const p2Input = { left: false, right: false, up: false, down: false };

    const { p1Velocity, p2Velocity } = computeCoopInput(p1Input, p2Input, 100, 100);

    expect(p1Velocity.vx).toBeCloseTo(-70.71, 2);
    expect(p1Velocity.vy).toBeCloseTo(-70.71, 2);

    expect(p2Velocity.vx).toBe(0);
    expect(p2Velocity.vy).toBe(0);
  });
});

describe('Coop System Drop-In', () => {
  it('should correctly determine if player 2 can drop in', () => {
    expect(canDropInPlayer2(false)).toBe(true);
    expect(canDropInPlayer2(true)).toBe(false);
  });
});
