import { describe, it, expect } from "vitest";

import { chunkNote, embeddableText, splitIntoSections } from "./chunk";
import { dot, LexicalEmbedder, normalize, tokenize } from "./embed";
import { bm25, buildLexicalStats, fuse, hybridSearch, vectorScores } from "./search";

describe("splitIntoSections", () => {
  it("groups content under its heading and builds a heading path", () => {
    const body = ["# Top", "intro", "## Middle", "detail", "### Deep", "more"].join("\n");
    const sections = splitIntoSections(body);

    expect(sections.map((s) => s.heading)).toEqual(["Top", "Top > Middle", "Top > Middle > Deep"]);
  });

  it("keeps text above the first heading with a null heading", () => {
    const sections = splitIntoSections("preamble text\n\n# Later");
    expect(sections[0]?.heading).toBeNull();
    expect(sections[0]?.lines.join("\n")).toContain("preamble");
  });

  it("does not treat a comment inside a code fence as a heading", () => {
    const body = ["# Real", "text", "```sh", "# not a heading", "ls", "```", "after"].join("\n");
    const sections = splitIntoSections(body);
    expect(sections).toHaveLength(1);
    expect(sections[0]?.heading).toBe("Real");
  });

  it("pops back up the heading stack", () => {
    const body = ["# A", "x", "## B", "y", "# C", "z"].join("\n");
    expect(splitIntoSections(body).map((s) => s.heading)).toEqual(["A", "A > B", "C"]);
  });
});

describe("chunkNote", () => {
  it("keeps a short section as one chunk", () => {
    const chunks = chunkNote("# Heading\n\nA reasonably long sentence about the vault.");
    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.heading).toBe("Heading");
  });

  it("splits an oversized section with overlap", () => {
    const paragraph = `${"word ".repeat(80)}\n\n`;
    const chunks = chunkNote(`# Long\n\n${paragraph.repeat(10)}`, { maxChars: 500 });

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.heading).toBe("Long");
      // Overlap can push a window slightly past the target; never unboundedly.
      expect(chunk.text.length).toBeLessThanOrEqual(600);
    }
  });

  it("always makes progress rather than looping on a huge unbroken run", () => {
    const chunks = chunkNote(`# X\n\n${"a".repeat(5000)}`, { maxChars: 200, overlapChars: 400 });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.length).toBeLessThan(200);
  });

  it("drops chunks below the minimum length", () => {
    expect(chunkNote("# A\n\nhi", { minChars: 40 })).toHaveLength(0);
  });

  it("reports a start line inside the note", () => {
    const body = ["# One", "first section text here", "", "# Two", "second section text here"].join("\n");
    const chunks = chunkNote(body, { minChars: 5 });
    expect(chunks[0]?.startLine).toBe(2);
    expect(chunks[1]?.startLine).toBeGreaterThan(chunks[0]!.startLine);
  });
});

describe("embeddableText", () => {
  it("prefixes the note title and heading so a passage carries context", () => {
    const text = embeddableText("MeasureWise", {
      heading: "Pricing",
      text: "We settled on three tiers.",
      startLine: 1,
    });
    expect(text).toBe("MeasureWise\nPricing\nWe settled on three tiers.");
  });
});

describe("vector helpers", () => {
  it("normalize produces a unit vector", () => {
    const unit = normalize(new Float32Array([3, 4]));
    expect(Math.hypot(unit[0]!, unit[1]!)).toBeCloseTo(1, 6);
  });

  it("normalize leaves a zero vector alone rather than dividing by zero", () => {
    const zero = normalize(new Float32Array([0, 0]));
    expect([...zero]).toEqual([0, 0]);
  });

  it("dot of identical unit vectors is 1", () => {
    const v = normalize(new Float32Array([1, 2, 3]));
    expect(dot(v, v)).toBeCloseTo(1, 6);
  });

  it("tokenize lowercases, splits on punctuation and drops single characters", () => {
    // "a" and the "i" from "I/O" are both one character, so both fall away.
    expect(tokenize("Hello, World! a I/O_2")).toEqual(["hello", "world", "o_2"]);
  });
});

describe("LexicalEmbedder", () => {
  const embedder = new LexicalEmbedder(256);

  it("is deterministic", async () => {
    const [a] = await embedder.embed(["the quick brown fox"]);
    const [b] = await embedder.embed(["the quick brown fox"]);
    expect([...a!]).toEqual([...b!]);
  });

  it("scores related text above unrelated text", async () => {
    const [query, related, unrelated] = await embedder.embed([
      "athena clinical inbox referrals",
      "working the athena inbox and referral queue",
      "sourdough starter feeding schedule",
    ]);
    expect(dot(query!, related!)).toBeGreaterThan(dot(query!, unrelated!));
  });

  it("returns unit vectors", async () => {
    const [vector] = await embedder.embed(["some text here"]);
    let sum = 0;
    for (const value of vector!) sum += value * value;
    expect(Math.sqrt(sum)).toBeCloseTo(1, 5);
  });
});

describe("bm25", () => {
  const documents = [
    "the athena clinical inbox needs working every morning",
    "pricing for the three measurewise tiers",
    "athena athena athena",
  ];
  const tokenized = documents.map(tokenize);
  const stats = buildLexicalStats(tokenized);
  const frequencies = tokenized.map((tokens) => {
    const counts = new Map<string, number>();
    for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1);
    return counts;
  });

  it("ranks the document that repeats the term highest", () => {
    const results = bm25("athena", frequencies, stats);
    expect(results[0]?.chunkId).toBe(2);
  });

  it("returns nothing for a term that appears nowhere", () => {
    expect(bm25("kubernetes", frequencies, stats)).toEqual([]);
  });

  it("returns nothing for an empty query", () => {
    expect(bm25("", frequencies, stats)).toEqual([]);
  });

  it("never scores a matched document at or below zero", () => {
    for (const result of bm25("the", frequencies, stats)) {
      expect(result.score).toBeGreaterThan(0);
    }
  });
});

describe("fuse", () => {
  it("rewards a document both lists rank highly", () => {
    const a = [
      { chunkId: 1, score: 0.9 },
      { chunkId: 2, score: 0.8 },
    ];
    const b = [
      { chunkId: 2, score: 5 },
      { chunkId: 3, score: 4 },
    ];
    expect(fuse([a, b])[0]?.chunkId).toBe(2);
  });

  it("ignores the raw score scale, using rank only", () => {
    const tiny = [{ chunkId: 7, score: 0.0001 }];
    const huge = [{ chunkId: 9, score: 9999 }];
    const fused = fuse([tiny, huge]);
    expect(fused[0]?.score).toBeCloseTo(fused[1]?.score ?? 0, 10);
  });

  it("honours per-list weights", () => {
    const semantic = [{ chunkId: 1, score: 1 }];
    const keyword = [{ chunkId: 2, score: 1 }];
    expect(fuse([semantic, keyword], 60, [3, 1])[0]?.chunkId).toBe(1);
  });
});

describe("vectorScores", () => {
  it("orders by cosine similarity", () => {
    const query = normalize(new Float32Array([1, 0]));
    const vectors = [
      normalize(new Float32Array([0, 1])),
      normalize(new Float32Array([1, 0.1])),
    ];
    expect(vectorScores(query, vectors)[0]?.chunkId).toBe(1);
  });
});

describe("hybridSearch", () => {
  const documents = [
    "the athena clinical inbox needs working every morning",
    "pricing for the three measurewise tiers",
    "sourdough starter feeding schedule",
  ];
  const tokenized = documents.map(tokenize);
  const stats = buildLexicalStats(tokenized);
  const frequencies = tokenized.map((tokens) => {
    const counts = new Map<string, number>();
    for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1);
    return counts;
  });

  it("finds the right passage using both retrievers", async () => {
    const embedder = new LexicalEmbedder(256);
    const vectors = await embedder.embed(documents);

    const results = await hybridSearch({
      query: "athena inbox",
      embedder,
      vectors,
      termFrequencies: frequencies,
      stats,
      limit: 3,
    });

    expect(results[0]?.chunkId).toBe(0);
  });

  it("falls back to keyword search when the embedder throws", async () => {
    const broken = {
      id: "lexical" as const,
      dimensions: 8,
      embed: async () => {
        throw new Error("model unavailable");
      },
    };

    const results = await hybridSearch({
      query: "measurewise pricing",
      embedder: broken,
      vectors: [new Float32Array(8), new Float32Array(8), new Float32Array(8)],
      termFrequencies: frequencies,
      stats,
      limit: 3,
    });

    expect(results[0]?.chunkId).toBe(1);
  });

  it("returns nothing for an empty corpus rather than throwing", async () => {
    const results = await hybridSearch({
      query: "anything",
      embedder: new LexicalEmbedder(16),
      vectors: [],
      termFrequencies: [],
      stats: buildLexicalStats([]),
      limit: 5,
    });
    expect(results).toEqual([]);
  });
});
