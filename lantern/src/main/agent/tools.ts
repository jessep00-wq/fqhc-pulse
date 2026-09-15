/**
 * The tools that make this assistant *yours* rather than a generic one.
 *
 * The Agent SDK already brings file reading, editing, globbing, grep and bash.
 * What it does not know is that a particular folder on this machine is a second
 * brain with structure worth respecting. These in-process MCP tools teach it:
 * search the vault semantically, read a note, remember something permanently,
 * log to today's daily note, and look at the screen.
 *
 * They run in the Electron main process, so there is no server to start and no
 * port to secure.
 */

import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

import type { VaultIndex } from "../rag/store";
import type { Vault } from "../vault/vault";
import { safeFilename } from "../vault/markdown";

export interface VaultToolDeps {
  vault: Vault;
  index: VaultIndex;
  /** Capture the current screen as a PNG data URL, or null when disabled. */
  captureScreen: () => Promise<string | null>;
}

/** Shape the MCP tool results expect: a list of content blocks. */
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] });

export function createVaultToolServer(deps: VaultToolDeps) {
  const searchVault = tool(
    "search_vault",
    "Search the user's personal note vault for passages relevant to a question. " +
      "Use this before answering anything about the user's own projects, people, " +
      "decisions, preferences or history — the vault is their long-term memory and " +
      "will contain things you cannot otherwise know.",
    {
      query: z.string().describe("What to look for, phrased as the user would say it"),
      limit: z.number().int().min(1).max(20).optional().describe("Max passages, default 6"),
    },
    async ({ query, limit }) => {
      const hits = await deps.index.search(query, limit ?? 6);
      if (hits.length === 0) {
        return text(`No passages in the vault matched "${query}".`);
      }
      const rendered = hits
        .map((hit, i) => {
          const where = hit.heading ? `${hit.noteTitle} › ${hit.heading}` : hit.noteTitle;
          return [
            `## Result ${i + 1}: ${where}`,
            `Note: ${hit.notePath} (line ${hit.startLine}, score ${hit.score.toFixed(3)})`,
            "",
            hit.text,
          ].join("\n");
        })
        .join("\n\n---\n\n");
      return text(rendered);
    },
    { annotations: { readOnlyHint: true, openWorldHint: false } },
  );

  const readNote = tool(
    "read_note",
    "Read one note from the vault in full, by its vault-relative path. " +
      "Use after search_vault when a passage looks relevant and you need the whole note.",
    {
      path: z.string().describe('Vault-relative path, e.g. "Projects/MeasureWise.md"'),
    },
    async ({ path }) => {
      try {
        const note = await deps.vault.readNote(path);
        const frontmatter = Object.keys(note.frontmatter).length
          ? `Frontmatter: ${JSON.stringify(note.frontmatter)}\n`
          : "";
        return text(`# ${note.title}\n${frontmatter}\n${note.body}`);
      } catch (error) {
        return text(`Could not read ${path}: ${error instanceof Error ? error.message : error}`);
      }
    },
    { annotations: { readOnlyHint: true, openWorldHint: false } },
  );

  const rememberFact = tool(
    "remember",
    "Save something worth keeping permanently to the vault, as a new note or appended " +
      "to an existing one. Use this when the user tells you a durable fact, preference, " +
      "decision or piece of context that you should still know in a month. Do not use it " +
      "for passing chatter.",
    {
      title: z.string().describe("Short title for the note"),
      content: z.string().describe("The note body, in Markdown"),
      folder: z.string().optional().describe('Vault folder, default "Memory"'),
      tags: z.array(z.string()).optional().describe("Tags to add to frontmatter"),
    },
    async ({ title, content, folder, tags }) => {
      const dir = (folder ?? "Memory").replace(/^\/+|\/+$/g, "");
      const filename = `${safeFilename(title)}.md`;
      const notePath = dir ? `${dir}/${filename}` : filename;

      if (await deps.vault.exists(notePath)) {
        const written = await deps.vault.appendToNote(
          notePath,
          `\n${content.trim()}\n`,
        );
        return text(`Appended to existing note ${written}.`);
      }

      const written = await deps.vault.writeNote(
        notePath,
        {
          title,
          created: new Date().toISOString(),
          source: "lantern",
          tags: tags?.length ? tags : ["memory"],
        },
        `${content.trim()}\n`,
      );
      return text(`Saved ${written}.`);
    },
    { annotations: { readOnlyHint: false, openWorldHint: false } },
  );

  const logToDaily = tool(
    "log_to_daily_note",
    "Append a timestamped line to today's daily note. Use for things that belong to " +
      "today specifically: what happened, what was decided, what the user did.",
    {
      line: z.string().describe("One line, written in the user's voice"),
      heading: z.string().optional().describe('Heading to file it under, default "Log"'),
    },
    async ({ line, heading }) => {
      const written = await deps.vault.appendToDailyNote(line, heading ?? "Log");
      return text(`Logged to ${written}.`);
    },
    { annotations: { readOnlyHint: false, openWorldHint: false } },
  );

  const readScreen = tool(
    "read_screen",
    "Take a screenshot of the user's screen and look at it. Use when the user refers " +
      'to something on screen ("what does this error mean", "read this to me") and you ' +
      "cannot answer from files alone.",
    {
      reason: z.string().describe("Why you need to see the screen, shown to the user"),
    },
    async ({ reason }) => {
      const dataUrl = await deps.captureScreen();
      if (!dataUrl) {
        return text("Screen reading is turned off in Lantern's settings.");
      }
      const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
      return {
        content: [
          { type: "text" as const, text: `Screenshot taken: ${reason}` },
          {
            type: "image" as const,
            data: base64,
            mimeType: "image/png",
          },
        ],
      };
    },
    { annotations: { readOnlyHint: true, openWorldHint: false } },
  );

  return createSdkMcpServer({
    name: "vault",
    version: "0.1.0",
    instructions:
      "Tools for the user's personal Obsidian vault, which is their long-term memory, " +
      "and for looking at their screen.",
    tools: [searchVault, readNote, rememberFact, logToDaily, readScreen],
  });
}

/** Fully-qualified names of the tools above, as the SDK addresses them. */
export const VAULT_TOOL_NAMES = [
  "mcp__vault__search_vault",
  "mcp__vault__read_note",
  "mcp__vault__remember",
  "mcp__vault__log_to_daily_note",
  "mcp__vault__read_screen",
] as const;
