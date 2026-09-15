/**
 * The IPC contract between the main process and the renderer windows.
 *
 * Channel names live here as const strings so main and preload cannot drift,
 * and the payload types are declared once for both sides. The preload script
 * exposes exactly the surface described by `LanternBridge` — the renderers
 * never touch `ipcRenderer` directly and never get Node access.
 */

import type {
  AgentState,
  ApprovalDecision,
  IndexStatus,
  LanternConfig,
  PendingApproval,
  RetrievedChunk,
  TranscriptEntry,
} from "./types";

/** Renderer -> main, request/response. */
export const INVOKE = {
  getConfig: "config:get",
  setConfig: "config:set",
  pickVault: "config:pick-vault",

  ask: "agent:ask",
  interrupt: "agent:interrupt",
  resolveApproval: "agent:resolve-approval",

  captureNote: "vault:capture",
  searchVault: "vault:search",
  reindexVault: "vault:reindex",
  indexStatus: "vault:index-status",

  hideOrb: "window:hide-orb",
  openConsole: "window:open-console",
  closeCapture: "window:close-capture",

  startListening: "voice:start",
  stopListening: "voice:stop",
  transcribe: "voice:transcribe",
  speak: "voice:speak",
} as const;

/** Main -> renderer, fire and forget. */
export const EVENT = {
  stateChanged: "evt:state",
  transcript: "evt:transcript",
  /** A chunk of assistant text as it streams in. */
  assistantDelta: "evt:assistant-delta",
  approvalRequested: "evt:approval",
  indexStatus: "evt:index-status",
  /** The orb should start listening (fired by the global hotkey). */
  wake: "evt:wake",
  error: "evt:error",
} as const;

export interface AskRequest {
  text: string;
  /** Include a screenshot of the current display with the question. */
  withScreen?: boolean;
}

export interface AssistantDelta {
  /** Empty string marks the start of a new assistant turn. */
  text: string;
  done: boolean;
}

/**
 * The typed surface the preload script exposes on `window.lantern`.
 * Every method is async because every one of them crosses a process boundary.
 */
export interface LanternBridge {
  getConfig(): Promise<LanternConfig>;
  setConfig(patch: Partial<LanternConfig>): Promise<LanternConfig>;
  pickVault(): Promise<string | null>;

  ask(req: AskRequest): Promise<void>;
  interrupt(): Promise<void>;
  resolveApproval(id: string, decision: ApprovalDecision): Promise<void>;

  captureNote(text: string): Promise<{ path: string }>;
  searchVault(query: string, limit?: number): Promise<RetrievedChunk[]>;
  reindexVault(): Promise<void>;
  indexStatus(): Promise<IndexStatus>;

  hideOrb(): Promise<void>;
  openConsole(): Promise<void>;
  closeCapture(): Promise<void>;

  startListening(): Promise<void>;
  stopListening(): Promise<void>;
  transcribe(pcm: ArrayBuffer, sampleRate: number): Promise<string>;
  speak(text: string): Promise<void>;

  onStateChanged(cb: (state: AgentState) => void): () => void;
  onTranscript(cb: (entry: TranscriptEntry) => void): () => void;
  onAssistantDelta(cb: (delta: AssistantDelta) => void): () => void;
  onApprovalRequested(cb: (approval: PendingApproval) => void): () => void;
  onIndexStatus(cb: (status: IndexStatus) => void): () => void;
  onWake(cb: () => void): () => void;
  onError(cb: (message: string) => void): () => void;
}

declare global {
  interface Window {
    lantern: LanternBridge;
  }
}
