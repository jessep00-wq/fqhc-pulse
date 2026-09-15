import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

/**
 * An explicit config so vitest does not walk up the directory tree and adopt a
 * parent project's vite config. Lantern is self-contained; its tests should be
 * too.
 *
 * The suite is deliberately Node-only. Everything under test here is pure
 * logic — Markdown parsing, chunking, ranking, the permission classifier,
 * audio encoding — none of which needs a DOM. The WebGL orb is verified by
 * rendering it in a real browser instead (see tools/orb-preview).
 */
export default defineConfig({
  root: __dirname,
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    reporters: ["default"],
  },
  resolve: {
    alias: {
      "@shared": resolve(__dirname, "src/shared"),
      "@main": resolve(__dirname, "src/main"),
    },
  },
});
