/**
 * The bridge between the renderers and the machine.
 *
 * This is the only code that sees both `ipcRenderer` and the page. It exposes
 * exactly the methods in the IPC contract and nothing else — no `require`, no
 * `process`, no raw channel access — so a renderer (or anything that manages to
 * run inside one) cannot reach past this surface.
 *
 * Every `on*` method returns its own unsubscribe function, because a renderer
 * that re-subscribes on every render and never detaches will leak listeners
 * until Electron starts warning about it.
 */

import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";

import { EVENT, INVOKE, type AskRequest, type AssistantDelta, type LanternBridge } from "../shared/ipc";
import type {
  AgentState,
  ApprovalDecision,
  IndexStatus,
  LanternConfig,
  PendingApproval,
  RetrievedChunk,
  TranscriptEntry,
} from "../shared/types";

function subscribe<T>(channel: string, callback: (payload: T) => void): () => void {
  const listener = (_event: IpcRendererEvent, payload: T) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

const bridge: LanternBridge = {
  getConfig: () => ipcRenderer.invoke(INVOKE.getConfig) as Promise<LanternConfig>,
  setConfig: (patch: Partial<LanternConfig>) =>
    ipcRenderer.invoke(INVOKE.setConfig, patch) as Promise<LanternConfig>,
  pickVault: () => ipcRenderer.invoke(INVOKE.pickVault) as Promise<string | null>,

  ask: (req: AskRequest) => ipcRenderer.invoke(INVOKE.ask, req) as Promise<void>,
  interrupt: () => ipcRenderer.invoke(INVOKE.interrupt) as Promise<void>,
  resolveApproval: (id: string, decision: ApprovalDecision) =>
    ipcRenderer.invoke(INVOKE.resolveApproval, id, decision) as Promise<void>,

  captureNote: (text: string) =>
    ipcRenderer.invoke(INVOKE.captureNote, text) as Promise<{ path: string }>,
  searchVault: (query: string, limit?: number) =>
    ipcRenderer.invoke(INVOKE.searchVault, query, limit) as Promise<RetrievedChunk[]>,
  reindexVault: () => ipcRenderer.invoke(INVOKE.reindexVault) as Promise<void>,
  indexStatus: () => ipcRenderer.invoke(INVOKE.indexStatus) as Promise<IndexStatus>,

  hideOrb: () => ipcRenderer.invoke(INVOKE.hideOrb) as Promise<void>,
  openConsole: () => ipcRenderer.invoke(INVOKE.openConsole) as Promise<void>,
  closeCapture: () => ipcRenderer.invoke(INVOKE.closeCapture) as Promise<void>,

  startListening: () => ipcRenderer.invoke(INVOKE.startListening) as Promise<void>,
  stopListening: () => ipcRenderer.invoke(INVOKE.stopListening) as Promise<void>,
  transcribe: (pcm: ArrayBuffer, sampleRate: number) =>
    ipcRenderer.invoke(INVOKE.transcribe, pcm, sampleRate) as Promise<string>,
  speak: (text: string) => ipcRenderer.invoke(INVOKE.speak, text) as Promise<void>,

  onStateChanged: (cb: (state: AgentState) => void) => subscribe(EVENT.stateChanged, cb),
  onTranscript: (cb: (entry: TranscriptEntry) => void) => subscribe(EVENT.transcript, cb),
  onAssistantDelta: (cb: (delta: AssistantDelta) => void) => subscribe(EVENT.assistantDelta, cb),
  onApprovalRequested: (cb: (approval: PendingApproval) => void) =>
    subscribe(EVENT.approvalRequested, cb),
  onIndexStatus: (cb: (status: IndexStatus) => void) => subscribe(EVENT.indexStatus, cb),
  onWake: (cb: () => void) => subscribe(EVENT.wake, () => cb()),
  onError: (cb: (message: string) => void) => subscribe(EVENT.error, cb),
};

contextBridge.exposeInMainWorld("lantern", bridge);

/**
 * The orb needs to toggle its own click-through as the pointer enters and
 * leaves the visible circle. It is a one-way signal, kept off the typed bridge
 * because only one window has any use for it.
 */
contextBridge.exposeInMainWorld("orbPointer", {
  setInteractive: (interactive: boolean) =>
    ipcRenderer.send("orb:set-interactive", interactive),
});
