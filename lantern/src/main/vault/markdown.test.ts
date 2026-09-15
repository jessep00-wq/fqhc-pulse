import { describe, it, expect } from "vitest";

import {
  dayStamp,
  extractLinks,
  extractTags,
  noteTitle,
  parseNote,
  safeFilename,
  serializeNote,
} from "./markdown";

describe("parseNote", () => {
  it("splits frontmatter from body", () => {
    const source = "---\ntitle: Pricing\ntags:\n  - work\n---\n\n# Pricing\n\nBody text.\n";
    const parsed = parseNote(source);

    expect(parsed.hadFrontmatter).toBe(true);
    expect(parsed.frontmatter.title).toBe("Pricing");
    expect(parsed.frontmatter.tags).toEqual(["work"]);
    expect(parsed.body).toBe("# Pricing\n\nBody text.\n");
  });

  it("leaves a note without frontmatter untouched", () => {
    const source = "# Just a note\n\nNo metadata here.\n";
    const parsed = parseNote(source);
    expect(parsed.hadFrontmatter).toBe(false);
    expect(parsed.body).toBe(source);
  });

  it("does not treat a horizontal rule mid-note as frontmatter", () => {
    const source = "Some text\n\n---\n\nMore text\n";
    const parsed = parseNote(source);
    expect(parsed.hadFrontmatter).toBe(false);
    expect(parsed.body).toBe(source);
  });

  it("keeps the text when the YAML is broken", () => {
    const source = "---\ntitle: [unclosed\n---\n\nBody survives.\n";
    const parsed = parseNote(source);
    expect(parsed.hadFrontmatter).toBe(false);
    expect(parsed.body).toContain("Body survives.");
  });

  it("strips a byte-order mark before looking for the fence", () => {
    const parsed = parseNote("﻿---\ntitle: X\n---\n\nBody\n");
    expect(parsed.frontmatter.title).toBe("X");
  });
});

describe("serializeNote", () => {
  it("round-trips through parseNote", () => {
    const frontmatter = { title: "Round trip", tags: ["a", "b"], count: 3 };
    const body = "# Round trip\n\nSome content.\n";
    const parsed = parseNote(serializeNote(frontmatter, body));

    expect(parsed.frontmatter).toEqual(frontmatter);
    expect(parsed.body).toBe(body);
  });

  it("writes no frontmatter block when there is no metadata", () => {
    expect(serializeNote({}, "Just a body\n")).toBe("Just a body\n");
  });
});

describe("extractLinks", () => {
  it("finds wikilinks and strips aliases and anchors", () => {
    const body = "See [[MeasureWise]], [[Just Jessica|the brand]] and [[Notes#Pricing]].";
    expect(extractLinks(body).sort()).toEqual(["Just Jessica", "MeasureWise", "Notes"]);
  });

  it("ignores links inside code", () => {
    expect(extractLinks("```\n[[NotALink]]\n```")).toEqual([]);
    expect(extractLinks("`[[AlsoNot]]`")).toEqual([]);
  });

  it("deduplicates", () => {
    expect(extractLinks("[[A]] and [[A]] again")).toEqual(["A"]);
  });
});

describe("extractTags", () => {
  it("finds inline tags", () => {
    expect(extractTags("Working on #project/active today").sort()).toEqual(["project/active"]);
  });

  it("does not mistake a heading for a tag", () => {
    expect(extractTags("# Heading\n\n## Another")).toEqual([]);
  });

  it("does not mistake a URL fragment for a tag", () => {
    expect(extractTags("See https://example.com/page#section")).toEqual([]);
  });

  it("merges frontmatter tags in both accepted shapes", () => {
    expect(extractTags("", { tags: ["one", "#two"] }).sort()).toEqual(["one", "two"]);
    expect(extractTags("", { tags: "three, four" }).sort()).toEqual(["four", "three"]);
  });

  it("ignores tags inside code blocks", () => {
    expect(extractTags("```\n#nope\n```")).toEqual([]);
  });
});

describe("noteTitle", () => {
  it("prefers frontmatter, then the first H1, then the filename", () => {
    expect(noteTitle("a/b.md", { title: "From matter" }, "# From heading")).toBe("From matter");
    expect(noteTitle("a/b.md", {}, "# From heading\n\ntext")).toBe("From heading");
    expect(noteTitle("a/My Note.md", {}, "no heading")).toBe("My Note");
  });
});

describe("safeFilename", () => {
  it("removes characters that are illegal on some OS", () => {
    expect(safeFilename('a/b\\c:d*e?f"g<h>i|j')).toBe("a b c d e f g h i j");
  });

  it("removes characters Obsidian reserves for its own syntax", () => {
    expect(safeFilename("[[link]] #tag ^block")).toBe("link tag block");
  });

  it("trims a trailing dot or space, which Windows rejects", () => {
    expect(safeFilename("trailing dot.")).toBe("trailing dot");
    expect(safeFilename("trailing space ")).toBe("trailing space");
  });

  it("falls back rather than returning an empty name", () => {
    expect(safeFilename("///")).toBe("Untitled");
    expect(safeFilename("")).toBe("Untitled");
  });

  it("truncates to the requested length", () => {
    expect(safeFilename("x".repeat(200), 20)).toHaveLength(20);
  });
});

describe("dayStamp", () => {
  it("formats the local date with zero padding", () => {
    expect(dayStamp(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(dayStamp(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});
