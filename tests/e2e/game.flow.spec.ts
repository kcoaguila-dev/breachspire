import { test, expect } from '@playwright/test';

test.describe('Breachspire Game Flow - Leader & Replay E2E', () => {

  test('Test 1: Replay Flow (Second Start Raid)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => {
      if (!err.message.includes("Phaser is not defined")) errors.push(err.message);
    });
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes("Phaser is not defined") && !msg.text().includes("Failed to load resource")) {
        errors.push(msg.text());
      }
    });

    await page.goto('/');

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    await canvas.click();

    await page.waitForTimeout(2000);

    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      const scene = game.scene.scenes.find((s: any) => s.scene.key === 'GameScene');
      if (scene && scene.handleGameOver) {
          // Pass the ECS world object which is imported in GameScene (it's in the global scope of the bundle but we can cheat by passing undefined if we mock it, or get it from scene)
          // Wait, scene.coreQuery needs `world`. Let's just set the state to DEFEAT instead of calling handleGameOver.
      }
    });

    // Instead of calling handleGameOver directly which expects `world`, we can just let the GameStateSystem do it
    // by setting player HP to 0! We can find the player entity and set its health to 0.
    // Or just set the game state directly.
    await page.evaluate(() => {
        // Just set the player hp to 0 to trigger permadeath
        // We know Health.current array is accessible if we could import it, but this is E2E
        // We can just find the global `world` if it was exported, but we didn't export it to window.
        // Let's just mock the win/loss condition.
        const game = (window as any).__PHASER_GAME__;
        const scene = game.scene.scenes.find((s: any) => s.scene.key === 'GameScene');
        if (scene) {
            // We can trick the scene by mocking `stateQuery` to return a fake entity
            // that says DEFEAT for one frame!
            // Actually, much simpler: just call handleGameOver and pass `null` but mock `coreQuery` for that call!
            const originalCoreQuery = scene.coreQuery;
            scene.coreQuery = () => [];
            scene.handleGameOver(false, null);
            scene.coreQuery = originalCoreQuery;
        }
    });

    await page.waitForTimeout(4000); // Title scene loaded

    await canvas.click();
    await page.waitForTimeout(2000); // Game scene re-loaded

    await expect(canvas).toBeVisible();

    const isGameSceneActive = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      return game.scene.scenes.some((s: any) => s.scene.key === 'GameScene' && s.sys.isActive());
    });

    expect(isGameSceneActive).toBe(true);
    expect(errors).toEqual([]);
  });

  test('Test 2: Leader Permadeath Text', async ({ page }) => {
    await page.goto('/');

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    await canvas.click();

    await page.waitForTimeout(2000);

    await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const scene = game.scene.scenes.find((s: any) => s.scene.key === 'GameScene');
        if (scene && scene.handleGameOver) {
            const originalCoreQuery = scene.coreQuery;
            scene.coreQuery = () => [];
            scene.handleGameOver(false, null);
            scene.coreQuery = originalCoreQuery;
        }
    });

    await page.waitForTimeout(500);

    const textExists = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const scene = game.scene.scenes.find((s: any) => s.scene.key === 'GameScene');
        if (!scene) return false;

        let found = false;
        scene.children.list.forEach((child: any) => {
            if (child.type === 'Text' && child.text === 'DEFEAT - THE COMMANDER HAS FALLEN') {
                found = true;
            }
        });
        return found;
    });

    expect(textExists).toBe(true);
  });

  test('Test 3: Leader Idleness (No auto-attack or auto-walk)', async ({ page }) => {
    await page.goto('/');

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    await canvas.click();

    await page.waitForTimeout(3000);

    const playerState = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const scene = game.scene.scenes.find((s: any) => s.scene.key === 'GameScene');
        if (!scene) return null;

        const playerSprite = scene.children.list.find((c: any) => c.type === 'Sprite' && c.texture.key === 'commander');

        if (!playerSprite) return null;

        return {
            x: playerSprite.x,
            y: playerSprite.y
        };
    });

    if (playerState) {
        expect(playerState.x).toBe(1600);
    }
  });

  test('Test 4: Clean Wilderness Start', async ({ page }) => {
    await page.goto('/');

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    await canvas.click();

    await page.waitForTimeout(1000);

    const goblinsInCamp = await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const scene = game.scene.scenes.find((s: any) => s.scene.key === 'GameScene');
        if (!scene) return -1;

        let count = 0;
        scene.children.list.forEach((child: any) => {
            if (child.type === 'Sprite' && child.texture && child.texture.key === 'goblin') {
                if (child.x > 1200 && child.x < 2000) {
                    count++;
                }
            }
        });
        return count;
    });

    expect(goblinsInCamp).toBe(0);
  });

  test('Test 5: Spire Dark Energy AI', async ({ page }) => {
    await page.goto('/');

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    await canvas.click();

    await page.waitForTimeout(1000);

    // Fast-forward time to simulate night and dark energy accumulation
    await page.evaluate(() => {
        const game = (window as any).__PHASER_GAME__;
        const scene = game.scene.scenes.find((s: any) => s.scene.key === 'GameScene');
        if (scene) {
            const originalSpireDirector = scene.spireDirectorSystem;
            scene.spireDirectorSystem = (worldObj: any, delta: number) => {
                // Pass a massive delta (500s) to build energy and spawn mobs
                return originalSpireDirector(worldObj, 500000);
            };

            const originalDayNight = scene.dayNightSystem;
            scene.dayNightSystem = (worldObj: any, delta: number) => {
                return originalDayNight(worldObj, 50000);
            };
        }
    });

    // Wait a brief moment to allow the systems to process the huge delta
    await page.waitForTimeout(500);

    // Verify SpireDirectorSystem made decisions by checking InvasionSpawner counts directly
    const pendingEnemyCount = await page.evaluate(() => {
        const breachspire = (window as any).__breachspire;
        if (!breachspire) return 0;

        const { InvasionSpawner } = breachspire;
        let totalPending = 0;

        // Count pending trolls or archers across all spires
        for (let i = 0; i < InvasionSpawner.pendingTrolls.length; i++) {
            totalPending += InvasionSpawner.pendingTrolls[i] || 0;
            totalPending += InvasionSpawner.pendingArchers[i] || 0;
            totalPending += InvasionSpawner.pendingGoblins[i] || 0;
        }

        return totalPending;
    });

    // We expect a massive influx of pending enemies after 500 seconds of accumulated dark energy
    expect(pendingEnemyCount).toBeGreaterThan(0);
  });
});
