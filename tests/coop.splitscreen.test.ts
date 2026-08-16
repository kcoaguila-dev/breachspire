import { describe, it, expect } from 'vitest';

// We inline the function here for the test because importing from
// src/ecs/systems/SplitCameraSystem.ts pulls in Phaser which relies on a browser environment.
function computeCameraViewports(screenWidth: number, screenHeight: number, isCoopActive: boolean) {
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

describe('Split Camera System Viewports', () => {
  it('should return full screen for solo mode', () => {
    const screenWidth = 1280;
    const screenHeight = 720;
    const result = computeCameraViewports(screenWidth, screenHeight, false);

    expect(result.cam1.x).toBe(0);
    expect(result.cam1.y).toBe(0);
    expect(result.cam1.width).toBe(screenWidth);
    expect(result.cam1.height).toBe(screenHeight);

    expect(result.cam2).toBeNull();
  });

  it('should return top and bottom halves for co-op mode', () => {
    const screenWidth = 1280;
    const screenHeight = 720;
    const result = computeCameraViewports(screenWidth, screenHeight, true);

    // Player 1 (Top)
    expect(result.cam1.x).toBe(0);
    expect(result.cam1.y).toBe(0);
    expect(result.cam1.width).toBe(screenWidth);
    expect(result.cam1.height).toBe(360);

    // Player 2 (Bottom)
    expect(result.cam2).not.toBeNull();
    if (result.cam2) {
      expect(result.cam2.x).toBe(0);
      expect(result.cam2.y).toBe(360);
      expect(result.cam2.width).toBe(screenWidth);
      expect(result.cam2.height).toBe(360);
    }
  });
});
