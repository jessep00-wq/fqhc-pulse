/**
 * The vault: an ordinary folder of Markdown files that Obsidian also opens.
 *
 * This is the assistant's long-term memory, and the design rule is that
 * Lantern is never the only thing that can read it. Everything written here is
 * plain Markdown with YAML frontmatter, in folders the user chose, so if
 * Lantern disappears tomorrow the memory is still a vault.
 *
 * Every path that comes from outside — a tool call, an IPC message, a link —
 * is resolved against the vault root and rejected if it escapes it.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

import type { VaultNote } from "../../shared/types";
import {
  dayStamp,
  extractLinks,
  extractTags,
  noteTitle,
  parseNote,
  safeFilename,
  serializeNote,
  timeStamp,
} from "./markdown";

/** Folders that are never notes, whatever the user has in the vault. */
const IGNORED_DIRS = new Set([".obsidian", ".trash", ".git", "node_modules", ".lantern"]);

export class VaultError extends Error {}

export interface VaultOptions {
  root: string;
  inboxFolder: string;
  dailyFolder: string;
}

export class Vault {
  constructor(private readonly options: VaultOptions) {}

  get root(): string {
    return this.options.root;
  }

  /**
   * Resolve a vault-relative path to an absolute one, refusing anything that
   * escapes the vault. This is the single chokepoint for path safety: a tool
   * call asking for `../../.ssh/id_rsa` dies here, not in the filesystem.
   */
  resolve(relativePath: string): string {
    if (path.isAbsolute(relativePath)) {
      throw new VaultError(`Path must be relative to the vault: ${relativePath}`);
    }
    const root = path.resolve(this.options.root);
    const target = path.resolve(root, relativePath);
    const rel = path.relative(root, target);
    if (rel.startsWith("..") || path.isAbsolute(rel)) {
      throw new VaultError(`Path escapes the vault: ${relativePath}`);
    }
    return target;
  }

  /** Vault-relative, forward-slashed path for an absolute file inside the vault. */
  relative(absolutePath: string): string {
    return path.relative(path.resolve(this.options.root), absolutePath).split(path.sep).join("/");
  }

  async exists(relativePath: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(relativePath));
      return true;
    } catch {
      return false;
    }
  }

  /** Every Markdown file in the vault, as vault-relative paths. */
  async listNotePaths(): Promise<string[]> {
    const out: string[] = [];
    const walk = async (dir: string): Promise<void> => {
      let entries;
      try {
        entries = await fs.readdir(dir, { withFileTypes: true });
      } catch {
        return; // An unreadable folder should not abort the whole scan.
      }
      for (const entry of entries) {
        if (entry.name.startsWith(".") && entry.isDirectory()) {
          if (IGNORED_DIRS.has(entry.name)) continue;
        }
        if (IGNORED_DIRS.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(full);
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
          out.push(this.relative(full));
        }
      }
    };
    await walk(path.resolve(this.options.root));
    return out.sort();
  }

  async readNote(relativePath: string): Promise<VaultNote> {
    const absolute = this.resolve(relativePath);
    const [raw, stat] = await Promise.all([fs.readFile(absolute, "utf8"), fs.stat(absolute)]);
    const parsed = parseNote(raw);
    return {
      path: this.relative(absolute),
      title: noteTitle(relativePath, parsed.frontmatter, parsed.body),
      frontmatter: parsed.frontmatter,
      body: parsed.body,
      links: extractLinks(parsed.body),
      tags: extractTags(parsed.body, parsed.frontmatter),
      modifiedAt: stat.mtimeMs,
    };
  }

  /**
   * Write a note, creating parent folders as needed.
   *
   * Writes go to a temporary file in the same directory and are then renamed,
   * so a crash mid-write cannot leave a half-written note where a good one
   * used to be. Obsidian's file watcher sees one atomic change.
   */
  async writeNote(
    relativePath: string,
    frontmatter: Record<string, unknown>,
    body: string,
  ): Promise<string> {
    const absolute = this.resolve(relativePath);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    const contents = serializeNote(frontmatter, body);
    const temp = `${absolute}.lantern-${process.pid}.tmp`;
    await fs.writeFile(temp, contents, "utf8");
    await fs.rename(temp, absolute);
    return this.relative(absolute);
  }

  /** Append to a note, creating it from `initialBody` when it does not exist. */
  async appendToNote(
    relativePath: string,
    text: string,
    initialBody = "",
  ): Promise<string> {
    const absolute = this.resolve(relativePath);
    await fs.mkdir(path.dirname(absolute), { recursive: true });

    let existing: string;
    try {
      existing = await fs.readFile(absolute, "utf8");
    } catch {
      existing = initialBody;
    }

    const separator = existing.length === 0 || existing.endsWith("\n") ? "" : "\n";
    await fs.writeFile(absolute, `${existing}${separator}${text}\n`, "utf8");
    return this.relative(absolute);
  }

  /** Vault-relative path of today's daily note. */
  dailyNotePath(date = new Date()): string {
    const folder = this.options.dailyFolder.replace(/^\/+|\/+$/g, "");
    const name = `${dayStamp(date)}.md`;
    return folder ? `${folder}/${name}` : name;
  }

  /**
   * Append a timestamped line to today's daily note under a heading, creating
   * both the note and the heading if this is the first entry of the day.
   */
  async appendToDailyNote(
    line: string,
    heading = "Log",
    date = new Date(),
  ): Promise<string> {
    const relativePath = this.dailyNotePath(date);
    const absolute = this.resolve(relativePath);
    await fs.mkdir(path.dirname(absolute), { recursive: true });

    let existing = "";
    try {
      existing = await fs.readFile(absolute, "utf8");
    } catch {
      existing = `# ${dayStamp(date)}\n`;
    }

    const entry = `- ${timeStamp(date)} ${line}`;
    const updated = insertUnderHeading(existing, heading, entry);
    await fs.writeFile(absolute, updated, "utf8");
    return this.relative(absolute);
  }

  /**
   * Save a quick capture as its own note in the inbox.
   *
   * The filename is derived from the first line so the inbox is skimmable in
   * Obsidian's file list, and a counter is appended rather than overwriting
   * when two captures on the same day share an opening line.
   */
  async captureNote(text: string, date = new Date()): Promise<string> {
    const folder = this.options.inboxFolder.replace(/^\/+|\/+$/g, "") || "Inbox";
    const firstLine = text.trim().split("\n")[0] ?? "Note";
    const base = `${dayStamp(date)} ${safeFilename(firstLine, 60)}`;

    let relativePath = `${folder}/${base}.md`;
    let counter = 2;
    while (await this.exists(relativePath)) {
      relativePath = `${folder}/${base} ${counter}.md`;
      counter += 1;
    }

    return this.writeNote(
      relativePath,
      {
        created: new Date(date).toISOString(),
        source: "lantern-capture",
        tags: ["inbox"],
      },
      `${text.trim()}\n`,
    );
  }
}

/**
 * Insert a line under a Markdown heading, appending the heading at the end of
 * the note when it is missing. Existing content under the heading is kept and
 * the new line goes after it, so a day's log reads top to bottom.
 */
export function insertUnderHeading(source: string, heading: string, line: string): string {
  const lines = source.split("\n");
  const headingPattern = new RegExp(`^#{1,6}\\s+${escapeRegExp(heading)}\\s*$`, "i");
  const headingIndex = lines.findIndex((l) => headingPattern.test(l));

  if (headingIndex === -1) {
    const body = source.endsWith("\n") || source === "" ? source : `${source}\n`;
    return `${body}\n## ${heading}\n\n${line}\n`;
  }

  // Walk to the end of this section: the next heading of any level, or EOF.
  let end = headingIndex + 1;
  while (end < lines.length && !/^#{1,6}\s/.test(lines[end] ?? "")) end += 1;

  // Step back over trailing blank lines so the entry sits with its siblings.
  let insertAt = end;
  while (insertAt > headingIndex + 1 && (lines[insertAt - 1] ?? "").trim() === "") {
    insertAt -= 1;
  }

  lines.splice(insertAt, 0, line);
  const joined = lines.join("\n");
  return joined.endsWith("\n") ? joined : `${joined}\n`;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
