/**
 * Types shared across the Electron main process, the preload bridge and every
 * renderer window. Nothing in this file may import from `electron`, `node:*`
 * or any renderer-only API — it is compiled into all three contexts.
 */

/** What the assistant is doing right now. The orb renders directly from this. */
export type AgentState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "working"
  | "error";

/** A single exchange in the running conversation. */
export interface TranscriptEntry {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  at: string;
  /** Set when the entry records a tool the agent ran. */
  tool?: {
    name: string;
    summary: string;
    ok: boolean;
  };
}

/** A note in the vault, as the app sees it. */
export interface VaultNote {
  /** Path relative to the vault root, e.g. "Projects/MeasureWise.md". */
  path: string;
  title: string;
  frontmatter: Record<string, unknown>;
  body: string;
  /** Wikilink targets found in the body, without brackets. */
  links: string[];
  tags: string[];
  modifiedAt: number;
}

/** One retrieved passage, with enough context to cite it. */
export interface RetrievedChunk {
  notePath: string;
  noteTitle: string;
  heading: string | null;
  text: string;
  score: number;
  /** Line number in the source note where this chunk starts, 1-indexed. */
  startLine: number;
}

/** A shell command the agent wants to run, awaiting the user's decision. */
export interface PendingApproval {
  id: string;
  toolName: string;
  title: string;
  /** The command or file path in question, rendered for a human. */
  detail: string;
  risk: RiskLevel;
  /** Why the classifier assigned that risk. */
  reason: string;
}

export type RiskLevel = "safe" | "caution" | "dangerous";

export type ApprovalDecision = "allow" | "allow-always" | "deny";

/** Everything the user can configure. Persisted as JSON in userData. */
export interface LanternConfig {
  /** Absolute path to the Obsidian vault. Empty until the user picks one. */
  vaultPath: string;
  /** Folder inside the vault for quick captures, e.g. "Inbox". */
  inboxFolder: string;
  /** Folder for daily notes, e.g. "Daily". */
  dailyFolder: string;
  /** Date format for daily note filenames. Only YYYY-MM-DD is supported. */
  model: string;
  /** Global shortcut that summons the orb and starts listening. */
  hotkeyTalk: string;
  /** Global shortcut that opens the quick-capture widget. */
  hotkeyCapture: string;
  /** Speak responses aloud. */
  voiceOutput: boolean;
  /** Shell commands matching these prefixes run without asking. */
  allowedCommands: string[];
  /** Let the agent take screenshots to answer questions about the screen. */
  screenReading: boolean;
  /** Path to a whisper.cpp-compatible binary, or empty to use the fallback. */
  sttBinary: string;
  /** Path to a whisper model file (.bin / .gguf). */
  sttModel: string;
  /** Path to a piper binary, or empty to use the OS voice. */
  ttsBinary: string;
  ttsModel: string;
}

export const DEFAULT_CONFIG: LanternConfig = {
  vaultPath: "",
  inboxFolder: "Inbox",
  dailyFolder: "Daily",
  model: "claude-opus-5",
  hotkeyTalk: "CommandOrControl+Shift+Space",
  hotkeyCapture: "CommandOrControl+Shift+N",
  voiceOutput: true,
  allowedCommands: ["git status", "git diff", "git log", "ls", "pwd", "cat"],
  screenReading: true,
  sttBinary: "",
  sttModel: "",
  ttsBinary: "",
  ttsModel: "",
};

/** Progress of a vault reindex, surfaced in the console window. */
export interface IndexStatus {
  state: "idle" | "indexing" | "ready" | "error";
  notesIndexed: number;
  chunksIndexed: number;
  /** Set when state is "error". */
  message?: string;
  /** Which embedding backend is actually in use. */
  backend: "transformers" | "lexical";
}
