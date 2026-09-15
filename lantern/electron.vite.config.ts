import { resolve } from "node:path";

import { defineConfig, externalizeDepsPlugin } from "electron-vite";

/**
 * Three build targets, one per Electron process.
 *
 * The renderer has three HTML entry points rather than one, because each
 * window is a genuinely separate page: the orb must stay tiny and start
 * instantly, and it should not carry the console's markup around with it.
 */
export default defineConfig({
  main: {
    // Native and heavy dependencies stay external so they are required at
    // runtime from node_modules rather than bundled into the main chunk.
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, "src/main/index.ts") },
      },
    },
    resolve: {
      alias: {
        "@shared": resolve(__dirname, "src/shared"),
        "@main": resolve(__dirname, "src/main"),
      },
    },
  },

  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, "src/preload/index.ts") },
        // An ESM preload keeps the same module semantics as the rest of the
        // app; Electron 28+ supports it.
        output: { format: "es", entryFileNames: "[name].mjs" },
      },
    },
  },

  renderer: {
    root: resolve(__dirname, "src/renderer"),
    resolve: {
      alias: { "@shared": resolve(__dirname, "src/shared") },
    },
    build: {
      rollupOptions: {
        input: {
          orb: resolve(__dirname, "src/renderer/orb.html"),
          capture: resolve(__dirname, "src/renderer/capture.html"),
          console: resolve(__dirname, "src/renderer/console.html"),
        },
      },
    },
  },
});
