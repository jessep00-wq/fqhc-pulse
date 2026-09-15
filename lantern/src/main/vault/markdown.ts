/**
 * Markdown parsing for an Obsidian-compatible vault.
 *
 * Pure functions only — no filesystem, no Electron — so the whole memory
 * format is testable in isolation. The contract with Obsidian matters more
 * than elegance here: notes this writes must look hand-written when opened in
 * Obsidian, and notes Obsidian wrote must survive a read/write round trip.
 */

import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

export interface ParsedNote {
  frontmatter: Record<string, unknown>;
  body: string;
  /** True when the source actually had a frontmatter block. */
  hadFrontmatter: boolean;
}

const FENCE = "---";

/**
 * Split a note into YAML frontmatter and body.
 *
 * Obsidian only treats `---` as frontmatter when it is the very first line, so
 * a horizontal rule further down the note is left alone. Malformed YAML is
 * never fatal: the block is returned as empty frontmatter and the raw text
 * stays in the body, so a bad note can still be read and searched.
 */
export function parseNote(source: string): ParsedNote {
  const normalized = source.replace(/^﻿/, "");
  if (!/^---[ \t]*\r?\n/.test(normalized)) {
    return { frontmatter: {}, body: normalized, hadFrontmatter: false };
  }

  const rest = normalized.slice(normalized.indexOf("\n") + 1);
  const closing = findClosingFence(rest);
  if (closing === null) {
    return { frontmatter: {}, body: normalized, hadFrontmatter: false };
  }

  const yamlText = rest.slice(0, closing.index);
  const body = rest.slice(closing.index + closing.length);

  let frontmatter: Record<string, unknown> = {};
  try {
    const parsed = parseYaml(yamlText);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      frontmatter = parsed as Record<string, unknown>;
    }
  } catch {
    // A note with broken YAML is still a note. Keep the text, drop the metadata.
    return { frontmatter: {}, body: normalized, hadFrontmatter: false };
  }

  return { frontmatter, body: stripLeadingNewline(body), hadFrontmatter: true };
}

/** Locate the closing `---` line, returning where it starts and how long it is. */
function findClosingFence(text: string): { index: number; length: number } | null {
  const pattern = /^---[ \t]*(\r?\n|$)/gm;
  const match = pattern.exec(text);
  if (!match) return null;
  return { index: match.index, length: match[0].length };
}

function stripLeadingNewline(text: string): string {
  return text.replace(/^\r?\n/, "");
}

/**
 * Render frontmatter and body back into a note.
 *
 * An empty frontmatter object writes no block at all, so a plain note never
 * grows an empty header just by being touched.
 */
export function serializeNote(frontmatter: Record<string, unknown>, body: string): string {
  const keys = Object.keys(frontmatter);
  if (keys.length === 0) return body;
  const yaml = stringifyYaml(frontmatter).trimEnd();
  return `${FENCE}\n${yaml}\n${FENCE}\n\n${body}`;
}

/** Inline code and fenced blocks, blanked out so scanners skip their contents. */
function maskCode(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, (m) => " ".repeat(m.length))
    .replace(/`[^`\n]*`/g, (m) => " ".repeat(m.length));
}

/**
 * Wikilink targets, without brackets, alias or heading anchor.
 * `[[Note|shown]]` and `[[Note#Heading]]` both yield "Note".
 */
export function extractLinks(body: string): string[] {
  const masked = maskCode(body);
  const found = new Set<string>();
  for (const match of masked.matchAll(/\[\[([^\]]+)\]\]/g)) {
    const raw = match[1];
    if (!raw) continue;
    const target = raw.split("|")[0]?.split("#")[0]?.trim();
    if (target) found.add(target);
  }
  return [...found];
}

/**
 * Tags from the body (`#project/active`) plus the `tags:` frontmatter key,
 * which Obsidian accepts as either a list or a comma-separated string.
 *
 * A `#` that opens a Markdown heading is not a tag, so headings are dropped,
 * and a tag must start a word so URL fragments do not become tags.
 */
export function extractTags(body: string, frontmatter: Record<string, unknown> = {}): string[] {
  const found = new Set<string>();

  const scannable = maskCode(body).replace(/^#{1,6}\s.*$/gm, "");
  for (const match of scannable.matchAll(/(^|[\s(])#([A-Za-z0-9_][A-Za-z0-9_/-]*)/g)) {
    if (match[2]) found.add(match[2]);
  }

  const raw = frontmatter.tags ?? frontmatter.tag;
  if (Array.isArray(raw)) {
    for (const t of raw) {
      if (typeof t === "string" && t.trim()) found.add(t.trim().replace(/^#/, ""));
    }
  } else if (typeof raw === "string") {
    for (const t of raw.split(",")) {
      const clean = t.trim().replace(/^#/, "");
      if (clean) found.add(clean);
    }
  }

  return [...found];
}

/**
 * A note's display title: the frontmatter `title`, else the first H1, else the
 * filename without its extension. This is the order Obsidian users expect.
 */
export function noteTitle(
  relativePath: string,
  frontmatter: Record<string, unknown>,
  body: string,
): string {
  const fmTitle = frontmatter.title;
  if (typeof fmTitle === "string" && fmTitle.trim()) return fmTitle.trim();

  const h1 = /^#\s+(.+)$/m.exec(maskCode(body));
  if (h1?.[1]) return h1[1].trim();

  const base = relativePath.split("/").pop() ?? relativePath;
  return base.replace(/\.md$/i, "");
}

/** Characters that are illegal in a filename on at least one target OS. */
const ILLEGAL_FILENAME = /[\\/:*?"<>|#^[\]]/g;

/** Escape a string so it is safe as a filename on every OS we target. */
export function safeFilename(text: string, maxLength = 80): string {
  let cleaned = "";
  for (const char of text.replace(ILLEGAL_FILENAME, " ")) {
    // Control characters are legal on Linux and rejected on Windows.
    cleaned += char.codePointAt(0)! < 0x20 ? " " : char;
  }
  const collapsed = cleaned.replace(/\s+/g, " ").trim();
  // A trailing dot or space is valid on Linux and invalid on Windows.
  const safe = collapsed.slice(0, maxLength).trim().replace(/[. ]+$/, "");
  return safe || "Untitled";
}

/** Local calendar day as YYYY-MM-DD — the daily-note filename convention. */
export function dayStamp(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local time as HH:MM, used to timestamp appended lines. */
export function timeStamp(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
