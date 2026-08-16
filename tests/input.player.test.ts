import { describe, it, expect } from 'vitest';
import { computePlayerVelocity } from '../src/ecs/systems/PlayerInputSystem';

describe('PlayerInputSystem — computePlayerVelocity', () => {
  it('should remain idle with no input', () => {
    const input = { left: false, right: false, up: false, down: false };
    const { vx, vy } = computePlayerVelocity(input, 100);
    expect(vx).toBe(0);
    expect(vy).toBe(0);
  });

  it('should move right correctly', () => {
    const input = { left: false, right: true, up: false, down: false };
    const { vx, vy } = computePlayerVelocity(input, 100);
    expect(vx).toBe(100);
    expect(vy).toBe(0);
  });

  it('should move left correctly', () => {
    const input = { left: true, right: false, up: false, down: false };
    const { vx, vy } = computePlayerVelocity(input, 100);
    expect(vx).toBe(-100);
    expect(vy).toBe(0);
  });

  it('should move up correctly', () => {
    const input = { left: false, right: false, up: true, down: false };
    const { vx, vy } = computePlayerVelocity(input, 100);
    expect(vx).toBe(0);
    expect(vy).toBe(-100);
  });

  it('should move down correctly', () => {
    const input = { left: false, right: false, up: false, down: true };
    const { vx, vy } = computePlayerVelocity(input, 100);
    expect(vx).toBe(0);
    expect(vy).toBe(100);
  });

  it('should handle diagonal movement and normalize speed', () => {
    const input = { left: false, right: true, up: true, down: false };
    const { vx, vy } = computePlayerVelocity(input, 100);

    // speed should be roughly 100 / sqrt(2) for both axes
    const expected = 100 / Math.sqrt(2);
    expect(vx).toBeCloseTo(expected);
    expect(vy).toBeCloseTo(-expected);

    // Magnitude should equal exactly 100
    const magnitude = Math.sqrt(vx * vx + vy * vy);
    expect(magnitude).toBeCloseTo(100);
  });

  it('should cancel out opposing directions', () => {
    const input = { left: true, right: true, up: false, down: false };
    const { vx, vy } = computePlayerVelocity(input, 100);
    expect(vx).toBe(0);
    expect(vy).toBe(0);
  });
});
