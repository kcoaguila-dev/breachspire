import { describe, it, expect } from 'vitest';
import { canClimbLadder } from '../src/ecs/systems/ClimbingSystem';

describe('canClimbLadder', () => {
    it('should return true when hero is within ladder bounds', () => {
        const ladderX = 100;
        const ladderBottomY = 200;
        const ladderTopY = 100;

        expect(canClimbLadder(105, 150, ladderX, ladderBottomY, ladderTopY)).toBe(true);
        expect(canClimbLadder(95, 150, ladderX, ladderBottomY, ladderTopY)).toBe(true);
    });

    it('should return false when hero is outside horizontal bounds', () => {
        const ladderX = 100;
        const ladderBottomY = 200;
        const ladderTopY = 100;

        expect(canClimbLadder(120, 150, ladderX, ladderBottomY, ladderTopY)).toBe(false);
        expect(canClimbLadder(80, 150, ladderX, ladderBottomY, ladderTopY)).toBe(false);
    });

    it('should return false when hero is outside vertical bounds', () => {
        const ladderX = 100;
        const ladderBottomY = 200;
        const ladderTopY = 100;

        expect(canClimbLadder(100, 250, ladderX, ladderBottomY, ladderTopY)).toBe(false);
        expect(canClimbLadder(100, 50, ladderX, ladderBottomY, ladderTopY)).toBe(false);
    });
});
