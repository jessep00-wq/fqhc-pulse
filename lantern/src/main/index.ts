/**
 * Lantern's main process: the only place with access to the filesystem, the
 * shell, the microphone pipeline and the model.
 *
 * It owns the three windows, the global hotkeys, the tray, the vault, the
 * index and the brain, and it is the single implementation behind every
 * channel in the IPC contract. Renderers ask; this process decides.
 */

import { app, BrowserWindow, dialog, globalShortcut, ipcMain, Menu, Tray, nativeImage } from "electron";
import path from "node:path";

import { EVENT, INVOKE, type AskRequest } from "../shared/ipc";
import {
  DEFAULT_CONFIG,
  type AgentState,
  type ApprovalDecision,
  type IndexStatus,
  type LanternConfig,
  type PendingApproval,
  type TranscriptEntry,
} from "../shared/types";
import { Brain } from "./agent/brain";
import { ConfigStore } from "./config";
import { VaultIndex } from "./rag/store";
import { captureScreen } from "./screen";
import { Vault } from "./vault/vault";
import { transcribe, TranscriptionUnavailable } from "./voice/stt";
import { Speaker } from "./voice/tts";
import { createCaptureWindow, createConsoleWindow, createOrbWindow, parkOrb } from "./windows";

/** A second copy fighting over the same hotkeys and vault index helps nobody. */
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let orbWindow: BrowserWindow | null = null;
let captureWindow: BrowserWindow | null = null;
let consoleWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

let config: ConfigStore;
let vault: Vault | null = null;
let index: VaultIndex | null = null;
let brain: Brain | null = null;
const speaker = new Speaker();

/** Approvals the UI has been asked about but the user has not answered. */
const approvalResolvers = new Map<string, (decision: ApprovalDecision) => void>();

/** Send an event to every live window. */
function broadcast(channel: string, payload?: unknown): void {
  for (const window of [orbWindow, captureWindow, consoleWindow]) {
    if (window && !window.isDestroyed()) {
      window.webContents.send(channel, payload);
    }
  }
}

function currentConfig(): LanternConfig {
  return config?.get() ?? { ...DEFAULT_CONFIG };
}

/**
 * Build the vault, index and brain for the configured vault path.
 * Called at startup and again whenever the user picks a different vault.
 */
async function wireVault(): Promise<void> {
  const settings = currentConfig();
  if (!settings.vaultPath) {
    vault = null;
    index = null;
    brain = null;
    return;
  }

  vault = new Vault({
    root: settings.vaultPath,
    inboxFolder: settings.inboxFolder,
    dailyFolder: settings.dailyFolder,
  });

  index = new VaultIndex(vault, (status: IndexStatus) => {
    broadcast(EVENT.indexStatus, status);
  });

  brain = new Brain({
    vault,
    index,
    getConfig: currentConfig,
    captureScreen: () =>
      captureScreen({
        hideDuring: () => [orbWindow, captureWindow].filter((w): w is BrowserWindow => w !== null),
      }),
    events: {
      onState: (state: AgentState) => {
        broadcast(EVENT.stateChanged, state);
        if (state !== "idle" && orbWindow && !orbWindow.isDestroyed() && !orbWindow.isVisible()) {
          orbWindow.showInactive();
        }
      },
      onTranscript: (entry: TranscriptEntry) => broadcast(EVENT.transcript, entry),
      onAssistantDelta: (text, done) => broadcast(EVENT.assistantDelta, { text, done }),
      onApprovalRequested: (approval: PendingApproval) => {
        // A decision needs a visible window to be made in.
        showConsole();
        broadcast(EVENT.approvalRequested, approval);
        return new Promise<ApprovalDecision>((resolve) => {
          approvalResolvers.set(approval.id, resolve);
        });
      },
      onError: (message: string) => broadcast(EVENT.error, message),
    },
  });

  // Indexing a large vault takes a while; do not block the first window.
  void index.reindex(false);
}

/** Speak a finished assistant turn, if voice output is on. */
function speakIfEnabled(text: string): void {
  const settings = currentConfig();
  if (!settings.voiceOutput || !text.trim()) return;
  void speaker
    .speak(text, { binary: settings.ttsBinary, model: settings.ttsModel })
    .catch(() => {
      // The text is already on screen; a missing voice is not worth an alert.
    });
}

function showOrb(): void {
  if (!orbWindow || orbWindow.isDestroyed()) return;
  parkOrb(orbWindow);
  orbWindow.showInactive();
}

function showConsole(): void {
  if (!consoleWindow || consoleWindow.isDestroyed()) {
    consoleWindow = createConsoleWindow();
    consoleWindow.once("ready-to-show", () => consoleWindow?.show());
    consoleWindow.on("closed", () => {
      consoleWindow = null;
    });
    return;
  }
  if (consoleWindow.isMinimized()) consoleWindow.restore();
  consoleWindow.show();
  consoleWindow.focus();
}

function showCapture(): void {
  if (!captureWindow || captureWindow.isDestroyed()) return;
  captureWindow.center();
  captureWindow.show();
  captureWindow.focus();
}

function registerHotkeys(): void {
  globalShortcut.unregisterAll();
  const settings = currentConfig();

  const talk = () => {
    showOrb();
    broadcast(EVENT.wake);
  };

  if (settings.hotkeyTalk && !globalShortcut.register(settings.hotkeyTalk, talk)) {
    broadcast(EVENT.error, `Could not register the talk shortcut ${settings.hotkeyTalk}.`);
  }
  if (settings.hotkeyCapture && !globalShortcut.register(settings.hotkeyCapture, showCapture)) {
    broadcast(EVENT.error, `Could not register the capture shortcut ${settings.hotkeyCapture}.`);
  }
}

/**
 * A tray icon drawn in code, so the app has no binary asset to ship or to get
 * out of sync with the orb's colours.
 */
function trayIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
    <defs><radialGradient id="g" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#ffd9a8"/><stop offset="55%" stop-color="#ff8a3d"/>
      <stop offset="100%" stop-color="#b03a86"/>
    </radialGradient></defs>
    <circle cx="11" cy="11" r="7" fill="url(#g)"/>
  </svg>`;
  return nativeImage.createFromDataURL(
    `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
  );
}

function buildTray(): void {
  tray = new Tray(trayIcon());
  tray.setToolTip("Lantern");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Talk to Lantern", click: () => { showOrb(); broadcast(EVENT.wake); } },
      { label: "Quick capture", click: showCapture },
      { label: "Open console", click: showConsole },
      { type: "separator" },
      { label: "Reindex vault", click: () => void index?.reindex(true) },
      { type: "separator" },
      { label: "Quit", click: () => app.quit() },
    ]),
  );
  tray.on("click", showConsole);
}

function registerIpc(): void {
  ipcMain.handle(INVOKE.getConfig, () => currentConfig());

  ipcMain.handle(INVOKE.setConfig, async (_event, patch: Partial<LanternConfig>) => {
    const before = currentConfig();
    const next = await config.set(patch);

    if (
      next.vaultPath !== before.vaultPath ||
      next.inboxFolder !== before.inboxFolder ||
      next.dailyFolder !== before.dailyFolder
    ) {
      await wireVault();
    }
    if (next.hotkeyTalk !== before.hotkeyTalk || next.hotkeyCapture !== before.hotkeyCapture) {
      registerHotkeys();
    }
    return next;
  });

  ipcMain.handle(INVOKE.pickVault, async () => {
    const result = await dialog.showOpenDialog({
      title: "Choose your Obsidian vault",
      properties: ["openDirectory", "createDirectory"],
    });
    const chosen = result.filePaths[0];
    if (result.canceled || !chosen) return null;
    await config.set({ vaultPath: chosen });
    await wireVault();
    return chosen;
  });

  ipcMain.handle(INVOKE.ask, async (_event, request: AskRequest) => {
    if (!brain) {
      broadcast(EVENT.error, "Choose a vault first — Lantern needs somewhere to remember.");
      return;
    }
    brain.markThinking();
    await brain.ask(request.text);
  });

  ipcMain.handle(INVOKE.interrupt, async () => {
    speaker.stop();
    await brain?.interrupt();
  });

  ipcMain.handle(
    INVOKE.resolveApproval,
    (_event, id: string, decision: ApprovalDecision) => {
      const resolve = approvalResolvers.get(id);
      if (resolve) {
        approvalResolvers.delete(id);
        resolve(decision);
      }
      brain?.resolveApproval(id, decision);
    },
  );

  ipcMain.handle(INVOKE.captureNote, async (_event, text: string) => {
    if (!vault) throw new Error("No vault is configured.");
    const notePath = await vault.captureNote(text);
    // A capture is worth indexing immediately; the user may ask about it next.
    void index?.reindex(false);
    return { path: notePath };
  });

  ipcMain.handle(INVOKE.searchVault, async (_event, query: string, limit?: number) => {
    if (!index) return [];
    return index.search(query, limit ?? 6);
  });

  ipcMain.handle(INVOKE.reindexVault, async () => {
    await index?.reindex(true);
  });

  ipcMain.handle(INVOKE.indexStatus, (): IndexStatus => {
    return (
      index?.getStatus() ?? {
        state: "idle",
        notesIndexed: 0,
        chunksIndexed: 0,
        backend: "lexical",
      }
    );
  });

  ipcMain.handle(INVOKE.hideOrb, () => orbWindow?.hide());
  ipcMain.handle(INVOKE.openConsole, () => showConsole());
  ipcMain.handle(INVOKE.closeCapture, () => captureWindow?.hide());

  ipcMain.handle(INVOKE.startListening, () => broadcast(EVENT.stateChanged, "listening"));
  ipcMain.handle(INVOKE.stopListening, () => broadcast(EVENT.stateChanged, "thinking"));

  ipcMain.handle(
    INVOKE.transcribe,
    async (_event, pcm: ArrayBuffer, sampleRate: number): Promise<string> => {
      const settings = currentConfig();
      try {
        return await transcribe(new Float32Array(pcm), sampleRate, {
          binary: settings.sttBinary,
          model: settings.sttModel,
        });
      } catch (error) {
        const message =
          error instanceof TranscriptionUnavailable
            ? error.message
            : `Transcription failed: ${error instanceof Error ? error.message : error}`;
        broadcast(EVENT.error, message);
        return "";
      }
    },
  );

  ipcMain.handle(INVOKE.speak, (_event, text: string) => {
    speakIfEnabled(text);
  });
}

/** Mouse-over the orb toggles click-through so the rest stays transparent. */
function registerOrbPointerBridge(): void {
  ipcMain.on("orb:set-interactive", (_event, interactive: boolean) => {
    if (!orbWindow || orbWindow.isDestroyed()) return;
    orbWindow.setIgnoreMouseEvents(!interactive, { forward: true });
  });
}

app.on("second-instance", () => showConsole());

app.whenReady().then(async () => {
  config = new ConfigStore(app.getPath("userData"));
  await config.load();

  registerIpc();
  registerOrbPointerBridge();

  orbWindow = createOrbWindow();
  captureWindow = createCaptureWindow();

  orbWindow.once("ready-to-show", () => orbWindow?.showInactive());

  buildTray();
  registerHotkeys();
  await wireVault();

  // No vault yet means a first run: open the console so setup is findable.
  if (!currentConfig().vaultPath) showConsole();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) showConsole();
  });
});

// The assistant lives in the tray; closing a window is not quitting.
app.on("window-all-closed", () => {
  // Intentionally empty on every platform.
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  speaker.stop();
  void brain?.stop();
});

/** Dock icon on macOS: hidden, since the orb and tray are the real surface. */
if (process.platform === "darwin") {
  app.dock?.hide();
}

export const userDataPath = (): string => path.join(app.getPath("userData"));
