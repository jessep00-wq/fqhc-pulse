/**
 * Ranking retrieved passages.
 *
 * Pure vector search is good at paraphrase and bad at proper nouns: ask about
 * "Athena" and a semantic model happily returns passages about clinical
 * workflows that never mention Athena. Pure keyword search has the opposite
 * failure. Lantern scores both and fuses the ranks, which is what makes
 * retrieval over a personal vault — full of names, project codewords and
 * shorthand only the owner uses — actually work.
 *
 * Everything here is pure so ranking can be tested without a model.
 */

import { dot, tokenize, type Embedder } from "./embed";

export interface ScoredChunk {
  chunkId: number;
  score: number;
}

/** Corpus statistics BM25 needs, computed once per index build. */
export interface LexicalStats {
  /** Number of documents containing each term. */
  documentFrequency: Map<string, number>;
  /** Token count per document, by chunk id. */
  lengths: number[];
  averageLength: number;
  documentCount: number;
}

export function buildLexicalStats(tokenizedDocuments: string[][]): LexicalStats {
  const documentFrequency = new Map<string, number>();
  const lengths: number[] = [];
  let total = 0;

  for (const tokens of tokenizedDocuments) {
    lengths.push(tokens.length);
    total += tokens.length;
    for (const term of new Set(tokens)) {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
    }
  }

  return {
    documentFrequency,
    lengths,
    averageLength: tokenizedDocuments.length ? total / tokenizedDocuments.length : 0,
    documentCount: tokenizedDocuments.length,
  };
}

const BM25_K1 = 1.5;
const BM25_B = 0.75;

/**
 * BM25 over the tokenized corpus.
 *
 * Term frequencies are passed in as per-document maps so the index can keep
 * them rather than re-tokenizing every passage on every query.
 */
export function bm25(
  query: string,
  termFrequencies: Array<Map<string, number>>,
  stats: LexicalStats,
): ScoredChunk[] {
  const queryTerms = tokenize(query);
  if (queryTerms.length === 0 || stats.documentCount === 0) return [];

  const scores: ScoredChunk[] = [];

  for (let id = 0; id < termFrequencies.length; id += 1) {
    const frequencies = termFrequencies[id];
    if (!frequencies) continue;

    const length = stats.lengths[id] ?? 0;
    let score = 0;

    for (const term of queryTerms) {
      const frequency = frequencies.get(term);
      if (!frequency) continue;

      const df = stats.documentFrequency.get(term) ?? 0;
      // Standard BM25 IDF, always positive so a term in every document
      // contributes ~0 rather than pushing scores negative.
      const idf = Math.log(1 + (stats.documentCount - df + 0.5) / (df + 0.5));
      const denominator =
        frequency + BM25_K1 * (1 - BM25_B + (BM25_B * length) / (stats.averageLength || 1));
      score += idf * ((frequency * (BM25_K1 + 1)) / denominator);
    }

    if (score > 0) scores.push({ chunkId: id, score });
  }

  return scores.sort((a, b) => b.score - a.score);
}

/** Cosine similarity of the query vector against every chunk vector. */
export function vectorScores(queryVector: Float32Array, vectors: Float32Array[]): ScoredChunk[] {
  const scores: ScoredChunk[] = [];
  for (let id = 0; id < vectors.length; id += 1) {
    const vector = vectors[id];
    if (!vector) continue;
    scores.push({ chunkId: id, score: dot(queryVector, vector) });
  }
  return scores.sort((a, b) => b.score - a.score);
}

/**
 * Reciprocal rank fusion.
 *
 * Fusing *ranks* rather than raw scores is deliberate: BM25 is unbounded while
 * cosine sits in [-1, 1], so any weighted sum of the two needs calibration
 * that drifts as the vault grows. RRF only cares about ordering, so it stays
 * stable from a fifty-note vault to a five-thousand-note one.
 *
 * `k` damps the top of each list; 60 is the value from the original paper and
 * behaves well at the list lengths used here.
 */
export function fuse(lists: ScoredChunk[][], k = 60, weights?: number[]): ScoredChunk[] {
  const totals = new Map<number, number>();

  lists.forEach((list, listIndex) => {
    const weight = weights?.[listIndex] ?? 1;
    list.forEach((entry, rank) => {
      const contribution = weight / (k + rank + 1);
      totals.set(entry.chunkId, (totals.get(entry.chunkId) ?? 0) + contribution);
    });
  });

  return [...totals.entries()]
    .map(([chunkId, score]) => ({ chunkId, score }))
    .sort((a, b) => b.score - a.score);
}

export interface HybridSearchInput {
  query: string;
  embedder: Embedder;
  vectors: Float32Array[];
  termFrequencies: Array<Map<string, number>>;
  stats: LexicalStats;
  limit: number;
  /** Relative weight of the semantic list against the keyword list. */
  semanticWeight?: number;
}

/**
 * Run both retrievers and fuse them. Falls back to keyword-only when the
 * embedder fails, because a degraded answer beats an error.
 */
export async function hybridSearch(input: HybridSearchInput): Promise<ScoredChunk[]> {
  const keyword = bm25(input.query, input.termFrequencies, input.stats).slice(0, 50);

  let semantic: ScoredChunk[] = [];
  if (input.vectors.length > 0) {
    try {
      const [queryVector] = await input.embedder.embed([input.query]);
      if (queryVector) semantic = vectorScores(queryVector, input.vectors).slice(0, 50);
    } catch {
      semantic = [];
    }
  }

  if (semantic.length === 0) return keyword.slice(0, input.limit);
  if (keyword.length === 0) return semantic.slice(0, input.limit);

  return fuse([semantic, keyword], 60, [input.semanticWeight ?? 1, 1]).slice(0, input.limit);
}
