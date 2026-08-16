import { describe, it, expect } from 'vitest';
import { computeSprintVelocity } from '../src/ecs/systems/PlayerInputSystem';

describe('Player Input System - Sprinting Mechanics', () => {
  const baseSpeed = 220;
  const sprintMultiplier = 380 / 220;

  it('should calculate base velocity when not sprinting', () => {
    const input = { left: false, right: true, up: false, down: false, isSprinting: false };
    const { vx, vy } = computeSprintVelocity(input, baseSpeed, sprintMultiplier);
    expect(vx).toBeCloseTo(220);
    expect(vy).toBeCloseTo(0);
  });

  it('should calculate sprint velocity when sprinting', () => {
    const input = { left: false, right: true, up: false, down: false, isSprinting: true };
    const { vx, vy } = computeSprintVelocity(input, baseSpeed, sprintMultiplier);
    expect(vx).toBeCloseTo(380);
    expect(vy).toBeCloseTo(0);
  });

  it('should normalize diagonal movement independently', () => {
    const input = { left: false, right: true, up: true, down: false, isSprinting: true };
    const { vx, vy } = computeSprintVelocity(input, baseSpeed, sprintMultiplier);

    expect(vx).toBeCloseTo(380 / Math.sqrt(2));
    expect(vy).toBeCloseTo(-380 / Math.sqrt(2));
  });

  it('should handle zero input', () => {
    const input = { left: false, right: false, up: false, down: false, isSprinting: true };
    const { vx, vy } = computeSprintVelocity(input, baseSpeed, sprintMultiplier);
    expect(vx).toBe(0);
    expect(vy).toBe(0);
  });
});