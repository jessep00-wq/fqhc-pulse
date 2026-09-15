/**
 * The console window: transcript, approvals and settings.
 *
 * Plain DOM rather than a framework. The whole window is a list that appends,
 * a form, and a settings panel — a framework would be more code than this, and
 * the app is better off shipping without one.
 */

import type {
  AgentState,
  IndexStatus,
  LanternConfig,
  PendingApproval,
  TranscriptEntry,
} from "../../shared/types";

const $ = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element as T;
};

const meta = $("meta");
const transcript = $("transcript");
const approvals = $("approvals");
const errors = $("errors");
const promptInput = $<HTMLInputElement>("prompt");
const composer = $<HTMLFormElement>("composer");
const sendButton = $<HTMLButtonElement>("send");
const stopButton = $<HTMLButtonElement>("stop");

const panels = {
  chat: $("panel-chat"),
  settings: $("panel-settings"),
};
const tabs = {
  chat: $<HTMLButtonElement>("tab-chat"),
  settings: $<HTMLButtonElement>("tab-settings"),
};

let config: LanternConfig | null = null;
let state: AgentState = "idle";
let indexStatus: IndexStatus = {
  state: "idle",
  notesIndexed: 0,
  chunksIndexed: 0,
  backend: "lexical",
};

/** The DOM node for the assistant turn currently streaming in, if any. */
let streamingBody: HTMLElement | null = null;

// --- chrome ---------------------------------------------------------------

function showTab(which: "chat" | "settings"): void {
  panels.chat.classList.toggle("hidden", which !== "chat");
  panels.settings.classList.toggle("hidden", which !== "settings");
  tabs.chat.setAttribute("aria-selected", String(which === "chat"));
  tabs.settings.setAttribute("aria-selected", String(which === "settings"));
}

tabs.chat.addEventListener("click", () => showTab("chat"));
tabs.settings.addEventListener("click", () => showTab("settings"));

const STATE_LABEL: Record<AgentState, string> = {
  idle: "Ready",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Answering",
  working: "Working",
  error: "Something went wrong",
};

function renderMeta(): void {
  const parts: string[] = [STATE_LABEL[state]];

  if (!config?.vaultPath) {
    parts.push("no vault chosen");
  } else {
    const name = config.vaultPath.split(/[\\/]/).filter(Boolean).pop() ?? config.vaultPath;
    parts.push(name);

    if (indexStatus.state === "indexing") parts.push("indexing…");
    else if (indexStatus.state === "ready") {
      parts.push(`${indexStatus.notesIndexed} notes, ${indexStatus.chunksIndexed} passages`);
      // Worth saying out loud: retrieval quality differs a lot between these.
      parts.push(
        indexStatus.backend === "transformers" ? "semantic search" : "keyword search only",
      );
    } else if (indexStatus.state === "error") parts.push("index failed");
  }

  meta.textContent = parts.join(" · ");
}

// --- transcript -----------------------------------------------------------

function renderEmptyState(): void {
  if (transcript.childElementCount > 0) return;
  const div = document.createElement("div");
  div.className = "empty";
  div.textContent = config?.vaultPath
    ? "Press your talk shortcut, or type below."
    : "Choose a vault in Settings to give Lantern a memory.";
  transcript.append(div);
}

function clearEmptyState(): void {
  transcript.querySelector(".empty")?.remove();
}

function appendEntry(entry: TranscriptEntry): HTMLElement {
  clearEmptyState();

  const row = document.createElement("div");
  row.className = `entry ${entry.role}`;

  const who = document.createElement("div");
  who.className = "who";
  who.textContent = entry.role === "user" ? "You" : entry.role === "assistant" ? "Lantern" : "";

  const body = document.createElement("div");
  body.className = "body";
  body.textContent = entry.text;

  row.append(who, body);
  transcript.append(row);
  scrollToEnd();
  return body;
}

function scrollToEnd(): void {
  const main = document.querySelector("main");
  if (main) main.scrollTop = main.scrollHeight;
}

// --- approvals ------------------------------------------------------------

function renderApproval(approval: PendingApproval): void {
  const card = document.createElement("div");
  card.className = `approval ${approval.risk === "dangerous" ? "" : "caution"}`;
  card.dataset.id = approval.id;

  const title = document.createElement("h3");
  title.textContent = `Lantern wants to ${approval.title.toLowerCase()}`;

  const detail = document.createElement("code");
  detail.textContent = approval.detail;

  const why = document.createElement("p");
  why.className = "why";
  why.textContent = approval.reason;

  const actions = document.createElement("div");
  actions.className = "actions";

  const allow = document.createElement("button");
  allow.className = "primary";
  allow.textContent = "Allow once";
  allow.addEventListener("click", () => resolve(approval.id, "allow", card));

  const always = document.createElement("button");
  always.className = "ghost";
  always.textContent = "Allow for this session";
  always.addEventListener("click", () => resolve(approval.id, "allow-always", card));

  const deny = document.createElement("button");
  deny.className = "danger";
  deny.textContent = "Deny";
  deny.addEventListener("click", () => resolve(approval.id, "deny", card));

  // Only shell commands are worth a durable session grant; a one-off file
  // write outside the vault should stay a one-off decision.
  if (approval.toolName === "Bash") actions.append(allow, always, deny);
  else actions.append(allow, deny);

  card.append(title, detail, why, actions);
  approvals.append(card);
  scrollToEnd();
}

function resolve(
  id: string,
  decision: "allow" | "allow-always" | "deny",
  card: HTMLElement,
): void {
  void window.lantern.resolveApproval(id, decision);
  card.remove();
}

// --- errors ---------------------------------------------------------------

function showError(message: string): void {
  const banner = document.createElement("div");
  banner.className = "banner bad";
  banner.textContent = message;
  errors.append(banner);
  setTimeout(() => banner.remove(), 12_000);
}

// --- composer -------------------------------------------------------------

composer.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = promptInput.value.trim();
  if (!text) return;
  promptInput.value = "";
  void window.lantern.ask({ text });
});

stopButton.addEventListener("click", () => void window.lantern.interrupt());

// --- settings -------------------------------------------------------------

const fields = {
  vault: $<HTMLInputElement>("vault"),
  inbox: $<HTMLInputElement>("inbox"),
  daily: $<HTMLInputElement>("daily"),
  model: $<HTMLInputElement>("model"),
  hotkeyTalk: $<HTMLInputElement>("hotkey-talk"),
  hotkeyCapture: $<HTMLInputElement>("hotkey-capture"),
  voiceOutput: $<HTMLInputElement>("voice-output"),
  screenReading: $<HTMLInputElement>("screen-reading"),
  allowlist: $<HTMLTextAreaElement>("allowlist"),
  sttBinary: $<HTMLInputElement>("stt-binary"),
  sttModel: $<HTMLInputElement>("stt-model"),
  ttsBinary: $<HTMLInputElement>("tts-binary"),
  ttsModel: $<HTMLInputElement>("tts-model"),
};

const settingsStatus = $("settings-status");

function fillSettings(next: LanternConfig): void {
  config = next;
  fields.vault.value = next.vaultPath;
  fields.inbox.value = next.inboxFolder;
  fields.daily.value = next.dailyFolder;
  fields.model.value = next.model;
  fields.hotkeyTalk.value = next.hotkeyTalk;
  fields.hotkeyCapture.value = next.hotkeyCapture;
  fields.voiceOutput.checked = next.voiceOutput;
  fields.screenReading.checked = next.screenReading;
  fields.allowlist.value = next.allowedCommands.join("\n");
  fields.sttBinary.value = next.sttBinary;
  fields.sttModel.value = next.sttModel;
  fields.ttsBinary.value = next.ttsBinary;
  fields.ttsModel.value = next.ttsModel;
  renderMeta();
}

$("pick-vault").addEventListener("click", async () => {
  const chosen = await window.lantern.pickVault();
  if (chosen) {
    fields.vault.value = chosen;
    fillSettings(await window.lantern.getConfig());
    clearEmptyState();
    renderEmptyState();
  }
});

$("save-settings").addEventListener("click", async () => {
  settingsStatus.textContent = "Saving…";
  try {
    const next = await window.lantern.setConfig({
      inboxFolder: fields.inbox.value.trim(),
      dailyFolder: fields.daily.value.trim(),
      model: fields.model.value.trim(),
      hotkeyTalk: fields.hotkeyTalk.value.trim(),
      hotkeyCapture: fields.hotkeyCapture.value.trim(),
      voiceOutput: fields.voiceOutput.checked,
      screenReading: fields.screenReading.checked,
      allowedCommands: fields.allowlist.value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      sttBinary: fields.sttBinary.value.trim(),
      sttModel: fields.sttModel.value.trim(),
      ttsBinary: fields.ttsBinary.value.trim(),
      ttsModel: fields.ttsModel.value.trim(),
    });
    fillSettings(next);
    settingsStatus.textContent = "Saved";
  } catch (error) {
    settingsStatus.textContent = error instanceof Error ? error.message : "Could not save";
  }
  setTimeout(() => (settingsStatus.textContent = ""), 2500);
});

$("reindex").addEventListener("click", async () => {
  settingsStatus.textContent = "Reindexing…";
  await window.lantern.reindexVault();
  settingsStatus.textContent = "";
});

// --- wiring ---------------------------------------------------------------

window.lantern.onStateChanged((next) => {
  state = next;
  sendButton.disabled = next === "thinking" || next === "working";
  renderMeta();
});

window.lantern.onTranscript((entry) => {
  // The streaming turn already rendered its own text; do not double it.
  if (entry.role === "assistant" && streamingBody) {
    streamingBody = null;
    return;
  }
  appendEntry(entry);
});

window.lantern.onAssistantDelta(({ text, done }) => {
  if (done) {
    streamingBody = null;
    return;
  }
  if (text === "") {
    streamingBody = appendEntry({
      id: `stream-${Date.now()}`,
      role: "assistant",
      text: "",
      at: new Date().toISOString(),
    });
    return;
  }
  if (streamingBody) {
    streamingBody.textContent = `${streamingBody.textContent ?? ""}${text}`;
    scrollToEnd();
  }
});

window.lantern.onApprovalRequested(renderApproval);
window.lantern.onIndexStatus((status) => {
  indexStatus = status;
  renderMeta();
  if (status.state === "error" && status.message) showError(`Indexing failed: ${status.message}`);
});
window.lantern.onError(showError);

void (async () => {
  const loaded = await window.lantern.getConfig();
  fillSettings(loaded);
  indexStatus = await window.lantern.indexStatus();
  renderMeta();
  renderEmptyState();
  // First run with no vault: settings is the only useful thing to show.
  if (!loaded.vaultPath) showTab("settings");
  promptInput.focus();
})();
