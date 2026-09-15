/**
 * The brain: one long-lived agent session, driven by the Claude Agent SDK.
 *
 * Two decisions shape this file.
 *
 * The session is *streaming-input* rather than one query per utterance. The SDK
 * accepts an async iterable of user messages, which means the conversation, the
 * loaded context and the warmed session all survive between things the user
 * says. Asking "what about the other one?" thirty seconds later works, and
 * interrupting mid-answer is possible at all.
 *
 * Every tool call passes through `canUseTool`. Reads run freely; writes inside
 * the vault run freely; anything that touches the machine or the network stops
 * and waits for the human. That gate is the difference between an assistant
 * with hands and a liability.
 */

import { query, type CanUseTool, type Options, type Query, type SDKUserMessage } from "@anthropic-ai/claude-agent-sdk";

import type {
  AgentState,
  ApprovalDecision,
  LanternConfig,
  PendingApproval,
  TranscriptEntry,
} from "../../shared/types";
import type { VaultIndex } from "../rag/store";
import type { Vault } from "../vault/vault";
import {
  ALWAYS_ALLOWED_TOOLS,
  ALWAYS_ASK_TOOLS,
  decideCommand,
  decideWrite,
} from "./permissions";
import { createVaultToolServer, VAULT_TOOL_NAMES } from "./tools";

export interface BrainEvents {
  onState(state: AgentState): void;
  onTranscript(entry: TranscriptEntry): void;
  onAssistantDelta(text: string, done: boolean): void;
  /** Ask the user about a tool call. Resolves with their decision. */
  onApprovalRequested(approval: PendingApproval): Promise<ApprovalDecision>;
  onError(message: string): void;
}

export interface BrainDeps {
  vault: Vault;
  index: VaultIndex;
  getConfig: () => LanternConfig;
  captureScreen: () => Promise<string | null>;
  events: BrainEvents;
}

/**
 * A promise with its resolver exposed, so the async message iterator can park
 * until the next thing the user says arrives.
 */
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

function systemPrompt(vaultRoot: string): string {
  return [
    "You are Lantern, a voice assistant running locally on the user's own computer.",
    "",
    "Your memory is an Obsidian vault of Markdown files at:",
    `  ${vaultRoot}`,
    "",
    "How to work:",
    "- Before answering anything about the user's own projects, people, decisions or",
    "  history, search the vault. You will not know these things otherwise, and",
    "  guessing about someone's own life reads as carelessness.",
    "- When the user tells you something durable — a preference, a decision, a fact",
    "  worth having in a month — save it with the remember tool. Do not ask permission",
    "  to remember; just do it and mention it in one short clause.",
    "- Cite notes by title when you use them, so the user can go read the source.",
    "- When something belongs to today specifically, log it to the daily note.",
    "",
    "How to speak:",
    "- Your replies are read aloud. Write for the ear: short sentences, no bullet",
    "  lists, no Markdown, no code blocks unless the user explicitly asks to hear code.",
    "- Lead with the answer. Two or three sentences is usually right.",
    "- If you ran a command or changed a file, say exactly what you did.",
    "- If you do not know, say so and say what you would need to find out.",
  ].join("\n");
}

export class Brain {
  private session: Query | null = null;
  private pending: Array<{ resolve: (message: SDKUserMessage) => void }> = [];
  private queue: SDKUserMessage[] = [];
  private state: AgentState = "idle";
  private pendingApprovals = new Map<string, (decision: ApprovalDecision) => void>();
  private sessionAllowlist: string[] = [];
  private approvalCounter = 0;

  constructor(private readonly deps: BrainDeps) {}

  getState(): AgentState {
    return this.state;
  }

  private setState(state: AgentState): void {
    if (this.state === state) return;
    this.state = state;
    this.deps.events.onState(state);
  }

  /** Send something the user said into the running session, starting it if needed. */
  async ask(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;

    this.deps.events.onTranscript({
      id: `u-${Date.now()}`,
      role: "user",
      text: trimmed,
      at: new Date().toISOString(),
    });

    const message: SDKUserMessage = {
      type: "user",
      session_id: "",
      parent_tool_use_id: null,
      message: { role: "user", content: [{ type: "text", text: trimmed }] },
    } as SDKUserMessage;

    const waiter = this.pending.shift();
    if (waiter) waiter.resolve(message);
    else this.queue.push(message);

    if (!this.session) this.start();
  }

  /** Stop the current turn without ending the session. */
  async interrupt(): Promise<void> {
    try {
      await this.session?.interrupt();
    } catch {
      // An interrupt on an already-finished turn is not worth surfacing.
    }
    this.setState("idle");
  }

  /** Resolve an approval the user was asked about. */
  resolveApproval(id: string, decision: ApprovalDecision): void {
    const resolve = this.pendingApprovals.get(id);
    if (!resolve) return;
    this.pendingApprovals.delete(id);
    resolve(decision);
  }

  /** End the session. The next `ask` starts a fresh one. */
  async stop(): Promise<void> {
    const session = this.session;
    this.session = null;
    try {
      await session?.return();
    } catch {
      // Already closed.
    }
    this.setState("idle");
  }

  private async *messages(): AsyncGenerator<SDKUserMessage> {
    while (true) {
      const queued = this.queue.shift();
      if (queued) {
        yield queued;
        continue;
      }
      const gate = deferred<SDKUserMessage>();
      this.pending.push({ resolve: gate.resolve });
      yield await gate.promise;
    }
  }

  private buildOptions(): Options {
    const config = this.deps.getConfig();
    return {
      model: config.model,
      cwd: this.deps.vault.root,
      systemPrompt: {
        type: "preset",
        preset: "claude_code",
        append: systemPrompt(this.deps.vault.root),
      },
      mcpServers: {
        vault: createVaultToolServer({
          vault: this.deps.vault,
          index: this.deps.index,
          captureScreen: config.screenReading
            ? this.deps.captureScreen
            : async () => null,
        }),
      },
      allowedTools: [...ALWAYS_ALLOWED_TOOLS, ...VAULT_TOOL_NAMES],
      permissionMode: "default",
      canUseTool: this.canUseTool,
      // The vault is memory, not a codebase: skip project-level CLAUDE.md and
      // settings so a stray file in the vault cannot rewrite the assistant.
      settingSources: [],
      includePartialMessages: true,
    };
  }

  /**
   * The permission gate. Runs for every tool call the SDK does not already
   * consider pre-approved.
   */
  private canUseTool: CanUseTool = async (toolName, input) => {
    const config = this.deps.getConfig();

    if (ALWAYS_ALLOWED_TOOLS.has(toolName) || VAULT_TOOL_NAMES.includes(toolName as never)) {
      return { behavior: "allow", updatedInput: input };
    }

    if (toolName === "Bash") {
      const command = typeof input.command === "string" ? input.command : "";
      const allowlist = [...config.allowedCommands, ...this.sessionAllowlist];
      const decision = decideCommand(command, allowlist);

      if (decision.autoApprove) return { behavior: "allow", updatedInput: input };

      return this.requestApproval({
        toolName,
        title: "Run a command",
        detail: command,
        risk: decision.risk,
        reason: decision.reason,
        rememberAs: firstTwoTokens(command),
        input,
      });
    }

    if (toolName === "Write" || toolName === "Edit" || toolName === "NotebookEdit") {
      const target = typeof input.file_path === "string" ? input.file_path : "";
      const decision = decideWrite(target, this.deps.vault.root);
      if (decision.autoApprove) return { behavior: "allow", updatedInput: input };

      return this.requestApproval({
        toolName,
        title: toolName === "Write" ? "Create or overwrite a file" : "Edit a file",
        detail: target,
        risk: decision.risk,
        reason: decision.reason,
        input,
      });
    }

    if (ALWAYS_ASK_TOOLS.has(toolName)) {
      return this.requestApproval({
        toolName,
        title: "Reach the internet",
        detail: typeof input.url === "string" ? input.url : JSON.stringify(input).slice(0, 200),
        risk: "caution",
        reason: "Sends a request off this machine",
        input,
      });
    }

    return this.requestApproval({
      toolName,
      title: `Use ${toolName}`,
      detail: JSON.stringify(input).slice(0, 300),
      risk: "caution",
      reason: "Not a tool Lantern recognises",
      input,
    });
  };

  private async requestApproval(args: {
    toolName: string;
    title: string;
    detail: string;
    risk: PendingApproval["risk"];
    reason: string;
    rememberAs?: string;
    input: Record<string, unknown>;
  }): Promise<{ behavior: "allow"; updatedInput: Record<string, unknown> } | { behavior: "deny"; message: string }> {
    this.approvalCounter += 1;
    const id = `approval-${this.approvalCounter}`;

    const approval: PendingApproval = {
      id,
      toolName: args.toolName,
      title: args.title,
      detail: args.detail,
      risk: args.risk,
      reason: args.reason,
    };

    const decision = await this.deps.events.onApprovalRequested(approval);

    if (decision === "deny") {
      return { behavior: "deny", message: "The user declined this action." };
    }

    if (decision === "allow-always" && args.rememberAs) {
      // Session-scoped only. Persisting an allowlist entry is a settings
      // change, and settings changes should happen in settings.
      this.sessionAllowlist.push(args.rememberAs);
    }

    return { behavior: "allow", updatedInput: args.input };
  }

  private start(): void {
    const session = query({ prompt: this.messages(), options: this.buildOptions() });
    this.session = session;
    void this.consume(session);
  }

  /** Drain the SDK's message stream into UI events. */
  private async consume(session: Query): Promise<void> {
    let buffer = "";
    let turnOpen = false;

    const closeTurn = () => {
      if (!turnOpen) return;
      this.deps.events.onAssistantDelta("", true);
      if (buffer.trim()) {
        this.deps.events.onTranscript({
          id: `a-${Date.now()}`,
          role: "assistant",
          text: buffer.trim(),
          at: new Date().toISOString(),
        });
      }
      buffer = "";
      turnOpen = false;
    };

    try {
      for await (const message of session) {
        switch (message.type) {
          case "stream_event": {
            // Partial assistant text, one delta at a time.
            const event = (message as { event?: { type?: string; delta?: { type?: string; text?: string } } }).event;
            if (event?.type === "content_block_delta" && event.delta?.type === "text_delta") {
              const delta = event.delta.text ?? "";
              if (!turnOpen) {
                turnOpen = true;
                this.setState("speaking");
                this.deps.events.onAssistantDelta("", false);
              }
              buffer += delta;
              this.deps.events.onAssistantDelta(delta, false);
            }
            break;
          }

          case "assistant": {
            const content = message.message?.content ?? [];
            for (const block of content) {
              if (block.type === "tool_use") {
                this.setState("working");
                this.deps.events.onTranscript({
                  id: `t-${Date.now()}-${block.id ?? ""}`,
                  role: "system",
                  text: describeTool(block.name, block.input as Record<string, unknown>),
                  at: new Date().toISOString(),
                  tool: {
                    name: block.name ?? "tool",
                    summary: describeTool(block.name, block.input as Record<string, unknown>),
                    ok: true,
                  },
                });
              }
            }
            break;
          }

          case "result": {
            closeTurn();
            this.setState("idle");
            break;
          }

          default:
            break;
        }
      }
    } catch (error) {
      closeTurn();
      this.setState("error");
      this.deps.events.onError(error instanceof Error ? error.message : String(error));
    } finally {
      if (this.session === session) this.session = null;
    }
  }

  /** Called when a question is dispatched, before the model replies. */
  markThinking(): void {
    this.setState("thinking");
  }
}

/** One line describing a tool call, for the transcript. */
function describeTool(name: string | undefined, input: Record<string, unknown>): string {
  switch (name) {
    case "Bash":
      return `Ran: ${String(input.command ?? "")}`;
    case "Read":
      return `Read ${String(input.file_path ?? "a file")}`;
    case "Write":
      return `Wrote ${String(input.file_path ?? "a file")}`;
    case "Edit":
      return `Edited ${String(input.file_path ?? "a file")}`;
    case "mcp__vault__search_vault":
      return `Searched the vault for "${String(input.query ?? "")}"`;
    case "mcp__vault__read_note":
      return `Read note ${String(input.path ?? "")}`;
    case "mcp__vault__remember":
      return `Remembered "${String(input.title ?? "")}"`;
    case "mcp__vault__log_to_daily_note":
      return "Logged to today's daily note";
    case "mcp__vault__read_screen":
      return "Looked at the screen";
    default:
      return `Used ${name ?? "a tool"}`;
  }
}

/** `git status --short` becomes `git status`, for a session allowlist entry. */
function firstTwoTokens(command: string): string {
  return command.trim().split(/\s+/).slice(0, 2).join(" ");
}
