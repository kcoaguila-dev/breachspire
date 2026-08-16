import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Run in Node environment — tests must NOT import Phaser (browser-only)
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Clear mocks between tests
    clearMocks: true,
    // Verbose output — agent-friendly
    reporter: "verbose",
  },
});
