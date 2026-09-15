import { resolve } from "node:path";

import { defineConfig } from "vite";

/** Standalone build of the orb harness; nothing Electron-specific is involved. */
export default defineConfig({
  root: __dirname,
  base: "./",
  build: { outDir: resolve(__dirname, "dist"), emptyOutDir: true },
});
