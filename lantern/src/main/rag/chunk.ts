/**
 * Splitting notes into retrievable passages.
 *
 * Markdown already carries the structure a naive character-window splitter
 * throws away, so chunks follow headings: a passage never straddles a heading
 * boundary, and every passage remembers which heading it came from. That
 * heading is worth as much as the text at retrieval time — "what did I decide
 * about pricing" should match a `## Pricing` section even when the prose never
 * repeats the word.
 *
 * Pure functions, no filesystem, so chunking is testable on its own.
 */

export interface Chunk {
  /** Heading path, e.g. "Projects > Pricing". Null above the first heading. */
  heading: string | null;
  text: string;
  /** 1-indexed line in the source note where this chunk starts. */
  startLine: number;
}

export interface ChunkOptions {
  /** Target characters per chunk. Sections longer than this are split. */
  maxChars: number;
  /** Characters of the previous window repeated into the next one. */
  overlapChars: number;
  /** Chunks shorter than this are dropped as noise. */
  minChars: number;
}

export const DEFAULT_CHUNK_OPTIONS: ChunkOptions = {
  maxChars: 1200,
  overlapChars: 150,
  minChars: 40,
};

interface Section {
  heading: string | null;
  lines: string[];
  startLine: number;
}

/**
 * Group a note's lines into heading-scoped sections.
 *
 * Fenced code blocks are tracked so a `#` inside a shell snippet is not
 * mistaken for a heading and does not split a section in the wrong place.
 */
export function splitIntoSections(body: string): Section[] {
  const lines = body.split("\n");
  const sections: Section[] = [];
  /** Heading text by level, so a deeper heading can name its ancestors. */
  const stack: string[] = [];
  let current: Section = { heading: null, lines: [], startLine: 1 };
  let inFence = false;

  lines.forEach((line, index) => {
    if (/^\s*```/.test(line)) inFence = !inFence;

    const headingMatch = inFence ? null : /^(#{1,6})\s+(.*\S)\s*$/.exec(line);
    if (headingMatch) {
      if (current.lines.some((l) => l.trim())) sections.push(current);

      const level = headingMatch[1]!.length;
      const text = headingMatch[2]!;
      stack.length = Math.max(0, Math.min(stack.length, level - 1));
      stack[level - 1] = text;

      current = {
        heading: stack.filter(Boolean).join(" > "),
        lines: [],
        startLine: index + 2,
      };
      return;
    }

    current.lines.push(line);
  });

  if (current.lines.some((l) => l.trim())) sections.push(current);
  return sections;
}

/**
 * Chunk a note body into passages.
 *
 * Sections that already fit become a single chunk. Longer ones are split on
 * paragraph boundaries where possible, falling back to a hard character
 * window only when a single paragraph is itself oversized.
 */
export function chunkNote(body: string, options: Partial<ChunkOptions> = {}): Chunk[] {
  const opts = { ...DEFAULT_CHUNK_OPTIONS, ...options };
  const chunks: Chunk[] = [];

  for (const section of splitIntoSections(body)) {
    const text = section.lines.join("\n").trim();
    if (!text) continue;

    if (text.length <= opts.maxChars) {
      if (text.length >= opts.minChars) {
        chunks.push({ heading: section.heading, text, startLine: section.startLine });
      }
      continue;
    }

    for (const piece of splitLongText(text, opts)) {
      if (piece.text.length < opts.minChars) continue;
      chunks.push({
        heading: section.heading,
        text: piece.text,
        // Offsets within the section translate back to note line numbers.
        startLine: section.startLine + countLines(text.slice(0, piece.offset)),
      });
    }
  }

  return chunks;
}

function countLines(text: string): number {
  let count = 0;
  for (const char of text) if (char === "\n") count += 1;
  return count;
}

/**
 * Break oversized text into overlapping windows, preferring paragraph breaks.
 * The overlap keeps a sentence that straddles a boundary retrievable from
 * either side.
 */
function splitLongText(
  text: string,
  opts: ChunkOptions,
): Array<{ text: string; offset: number }> {
  const out: Array<{ text: string; offset: number }> = [];
  let cursor = 0;

  while (cursor < text.length) {
    let end = Math.min(cursor + opts.maxChars, text.length);

    if (end < text.length) {
      // Prefer a paragraph break, then a line break, in the last third.
      const searchFrom = cursor + Math.floor(opts.maxChars * 0.6);
      const paragraph = text.lastIndexOf("\n\n", end);
      const line = text.lastIndexOf("\n", end);
      if (paragraph > searchFrom) end = paragraph;
      else if (line > searchFrom) end = line;
    }

    const piece = text.slice(cursor, end).trim();
    if (piece) out.push({ text: piece, offset: cursor });

    if (end >= text.length) break;
    const next = end - opts.overlapChars;
    // Always move forward, even if the overlap would otherwise stall us.
    cursor = next > cursor ? next : end;
  }

  return out;
}

/**
 * The text actually handed to the embedder.
 *
 * Prefixing the note title and heading means a passage carries its own
 * context, which measurably helps short passages that would otherwise embed
 * to something generic.
 */
export function embeddableText(noteTitle: string, chunk: Chunk): string {
  const parts = [noteTitle];
  if (chunk.heading) parts.push(chunk.heading);
  parts.push(chunk.text);
  return parts.join("\n");
}
