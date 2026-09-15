/**
 * The three windows.
 *
 *   Orb     — frameless, transparent, always on top, click-through except over
 *             the orb itself. This is the assistant's presence on the desktop.
 *   Capture — a small centred panel for getting a thought into the inbox.
 *   Console — an ordinary window with the transcript, settings and index state.
 *
 * All three run with `nodeIntegration: false` and `contextIsolation: true`.
 * The renderers reach the machine only through the preload bridge, which
 * exposes exactly the methods in the IPC contract and nothing else.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

import { BrowserWindow, screen, shell } from "electron";

const here = path.dirname(fileURLToPath(import.meta.url));

/** electron-vite sets this in dev; in production we load built files. */
const DEV_SERVER = process.env.ELECTRON_RENDERER_URL;

const preloadPath = path.join(here, "../preload/index.mjs");

function rendererEntry(name: "orb" | "capture" | "console"): {
  url?: string;
  file?: string;
} {
  if (DEV_SERVER) return { url: `${DEV_SERVER}/${name}.html` };
  return { file: path.join(here, `../renderer/${name}.html`) };
}

function load(window: BrowserWindow, name: "orb" | "capture" | "console"): void {
  const entry = rendererEntry(name);
  if (entry.url) void window.loadURL(entry.url);
  else if (entry.file) void window.loadFile(entry.file);
}

const ORB_SIZE = 260;

export function createOrbWindow(): BrowserWindow {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;
  const { x: originX, y: originY } = display.workArea;

  const window = new BrowserWindow({
    width: ORB_SIZE,
    height: ORB_SIZE,
    // Bottom-right, inset from the corner so it clears the dock or taskbar.
    x: originX + width - ORB_SIZE - 32,
    y: originY + height - ORB_SIZE - 32,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    hasShadow: false,
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    // Do not steal focus from whatever the user is actually working in.
    focusable: false,
    show: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Float above full-screen apps rather than disappearing behind them.
  window.setAlwaysOnTop(true, "screen-saver");
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // Clicks pass through the transparent corners; the renderer re-enables
  // interaction while the pointer is over the orb itself.
  window.setIgnoreMouseEvents(true, { forward: true });

  load(window, "orb");
  return window;
}

export function createCaptureWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 560,
    height: 220,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    center: true,
    show: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  window.setAlwaysOnTop(true, "screen-saver");
  // Getting a thought down should not cost the user their place.
  window.on("blur", () => window.hide());

  load(window, "capture");
  return window;
}

export function createConsoleWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 940,
    height: 720,
    minWidth: 520,
    minHeight: 420,
    title: "Lantern",
    backgroundColor: "#0b0710",
    show: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Links in the transcript open in the real browser, never in the app.
  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  load(window, "console");
  return window;
}

/** Move the orb window so it sits over the given display corner. */
export function parkOrb(window: BrowserWindow): void {
  if (window.isDestroyed()) return;
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const { width, height } = display.workAreaSize;
  const { x, y } = display.workArea;
  window.setPosition(x + width - ORB_SIZE - 32, y + height - ORB_SIZE - 32);
}
