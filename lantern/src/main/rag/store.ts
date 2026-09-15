/**
 * The vault index: chunks, their vectors, and the keyword statistics.
 *
 * Held in memory for query speed and persisted to a single file under the
 * vault's `.lantern/` folder so a restart does not re-embed the whole vault.
 * Notes are fingerprinted by mtime and size, so a reindex only touches the
 * notes that actually changed.
 *
 * The index is a cache, never a source of truth. Deleting `.lantern/` costs
 * nothing but the time to rebuild — the Markdown is the real memory.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

import type { IndexStatus, RetrievedChunk } from "../../shared/types";
import type { Vault } from "../vault/vault";
import { chunkNote, embeddableText, type Chunk } from "./chunk";
import { createEmbedder, tokenize, type Embedder } from "./embed";
import {
  buildLexicalStats,
  hybridSearch,
  type LexicalStats,
} from "./search";

const INDEX_VERSION = 1;
const INDEX_DIR = ".lantern";
const INDEX_FILE = "index.json";
/** Batch size for embedding. Large enough to amortize, small enough to stream. */
const EMBED_BATCH = 32;

interface StoredChunk {
  notePath: string;
  noteTitle: string;
  heading: string | null;
  text: string;
  startLine: number;
}

interface NoteFingerprint {
  mtimeMs: number;
  size: number;
  /** Indices into the chunk array that came from this note. */
  chunkIds: number[];
}

interface PersistedIndex {
  version: number;
  backend: string;
  dimensions: number;
  chunks: StoredChunk[];
  /** Vectors flattened row-major and stored as a base64 Float32 buffer. */
  vectors: string;
  fingerprints: Record<string, { mtimeMs: number; size: number; chunkIds: number[] }>;
}

export class VaultIndex {
  private chunks: StoredChunk[] = [];
  private vectors: Float32Array[] = [];
  private termFrequencies: Array<Map<string, number>> = [];
  private stats: LexicalStats = buildLexicalStats([]);
  private fingerprints = new Map<string, NoteFingerprint>();
  private embedder: Embedder | null = null;

  private status: IndexStatus = {
    state: "idle",
    notesIndexed: 0,
    chunksIndexed: 0,
    backend: "lexical",
  };

  constructor(
    private readonly vault: Vault,
    private readonly onStatus: (status: IndexStatus) => void = () => {},
  ) {}

  getStatus(): IndexStatus {
    return { ...this.status };
  }

  private setStatus(patch: Partial<IndexStatus>): void {
    this.status = { ...this.status, ...patch };
    this.onStatus(this.getStatus());
  }

  private indexPath(): string {
    return path.join(this.vault.root, INDEX_DIR, INDEX_FILE);
  }

  private async ensureEmbedder(): Promise<Embedder> {
    if (!this.embedder) {
      this.embedder = await createEmbedder(true);
      this.setStatus({ backend: this.embedder.id });
    }
    return this.embedder;
  }

  /**
   * Build or refresh the index.
   *
   * Notes whose mtime and size are unchanged keep their existing chunks and
   * vectors, so the common case — one note edited since last launch — costs
   * one file read and a handful of embeddings rather than a full rebuild.
   */
  async reindex(force = false): Promise<void> {
    this.setStatus({ state: "indexing", message: undefined });

    try {
      const embedder = await this.ensureEmbedder();
      if (!force) await this.load();

      const notePaths = await this.vault.listNotePaths();
      const nextChunks: StoredChunk[] = [];
      const nextVectors: Float32Array[] = [];
      const nextFingerprints = new Map<string, NoteFingerprint>();

      /** Chunks awaiting embedding, with the slot each will occupy. */
      const pending: Array<{ slot: number; text: string }> = [];

      for (const notePath of notePaths) {
        let note;
        try {
          note = await this.vault.readNote(notePath);
        } catch {
          continue; // A file that vanished mid-scan is not an error.
        }

        const size = Buffer.byteLength(note.body, "utf8");
        const previous = this.fingerprints.get(notePath);
        const unchanged =
          !force &&
          previous &&
          previous.mtimeMs === note.modifiedAt &&
          previous.size === size &&
          previous.chunkIds.every((id) => this.chunks[id] && this.vectors[id]);

        if (unchanged) {
          const chunkIds: number[] = [];
          for (const oldId of previous.chunkIds) {
            const slot = nextChunks.length;
            nextChunks.push(this.chunks[oldId]!);
            nextVectors.push(this.vectors[oldId]!);
            chunkIds.push(slot);
          }
          nextFingerprints.set(notePath, { mtimeMs: note.modifiedAt, size, chunkIds });
          continue;
        }

        const chunkIds: number[] = [];
        for (const chunk of chunkNote(note.body)) {
          const slot = nextChunks.length;
          nextChunks.push(toStored(note.path, note.title, chunk));
          // Placeholder, replaced once the batch is embedded.
          nextVectors.push(new Float32Array(embedder.dimensions));
          pending.push({ slot, text: embeddableText(note.title, chunk) });
          chunkIds.push(slot);
        }
        nextFingerprints.set(notePath, { mtimeMs: note.modifiedAt, size, chunkIds });
      }

      for (let i = 0; i < pending.length; i += EMBED_BATCH) {
        const batch = pending.slice(i, i + EMBED_BATCH);
        const vectors = await embedder.embed(batch.map((entry) => entry.text));
        batch.forEach((entry, offset) => {
          const vector = vectors[offset];
          if (vector) nextVectors[entry.slot] = vector;
        });
        this.setStatus({ chunksIndexed: Math.min(i + batch.length, pending.length) });
      }

      this.chunks = nextChunks;
      this.vectors = nextVectors;
      this.fingerprints = nextFingerprints;
      this.rebuildLexical();

      this.setStatus({
        state: "ready",
        notesIndexed: nextFingerprints.size,
        chunksIndexed: nextChunks.length,
      });

      await this.save();
    } catch (error) {
      this.setStatus({
        state: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private rebuildLexical(): void {
    const tokenized = this.chunks.map((chunk) =>
      tokenize(`${chunk.noteTitle} ${chunk.heading ?? ""} ${chunk.text}`),
    );
    this.termFrequencies = tokenized.map((tokens) => {
      const counts = new Map<string, number>();
      for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1);
      return counts;
    });
    this.stats = buildLexicalStats(tokenized);
  }

  /** Retrieve the passages most relevant to a query. */
  async search(query: string, limit = 6): Promise<RetrievedChunk[]> {
    if (this.chunks.length === 0) return [];
    const embedder = await this.ensureEmbedder();

    const scored = await hybridSearch({
      query,
      embedder,
      vectors: this.vectors,
      termFrequencies: this.termFrequencies,
      stats: this.stats,
      limit,
    });

    const out: RetrievedChunk[] = [];
    for (const hit of scored) {
      const chunk = this.chunks[hit.chunkId];
      if (!chunk) continue;
      out.push({
        notePath: chunk.notePath,
        noteTitle: chunk.noteTitle,
        heading: chunk.heading,
        text: chunk.text,
        score: hit.score,
        startLine: chunk.startLine,
      });
    }
    return out;
  }

  async save(): Promise<void> {
    const dimensions = this.vectors[0]?.length ?? 0;
    const flat = new Float32Array(this.vectors.length * dimensions);
    this.vectors.forEach((vector, i) => flat.set(vector, i * dimensions));

    const payload: PersistedIndex = {
      version: INDEX_VERSION,
      backend: this.embedder?.id ?? "lexical",
      dimensions,
      chunks: this.chunks,
      vectors: Buffer.from(flat.buffer, flat.byteOffset, flat.byteLength).toString("base64"),
      fingerprints: Object.fromEntries(this.fingerprints),
    };

    const file = this.indexPath();
    await fs.mkdir(path.dirname(file), { recursive: true });
    const temp = `${file}.tmp`;
    await fs.writeFile(temp, JSON.stringify(payload), "utf8");
    await fs.rename(temp, file);
  }

  /**
   * Load a persisted index. A version bump, a backend switch or any corruption
   * simply yields an empty index, which triggers a full rebuild — the cache is
   * never worth failing a launch over.
   */
  async load(): Promise<boolean> {
    try {
      const raw = await fs.readFile(this.indexPath(), "utf8");
      const parsed = JSON.parse(raw) as PersistedIndex;
      if (parsed.version !== INDEX_VERSION) return false;

      const embedder = await this.ensureEmbedder();
      if (parsed.backend !== embedder.id) return false;

      const buffer = Buffer.from(parsed.vectors, "base64");
      const flat = new Float32Array(
        buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
      );

      const dimensions = parsed.dimensions;
      if (dimensions > 0 && flat.length !== parsed.chunks.length * dimensions) return false;

      this.chunks = parsed.chunks;
      this.vectors = parsed.chunks.map((_, i) =>
        dimensions > 0 ? flat.slice(i * dimensions, (i + 1) * dimensions) : new Float32Array(0),
      );
      this.fingerprints = new Map(Object.entries(parsed.fingerprints));
      this.rebuildLexical();

      this.setStatus({
        state: "ready",
        notesIndexed: this.fingerprints.size,
        chunksIndexed: this.chunks.length,
        backend: embedder.id,
      });
      return true;
    } catch {
      return false;
    }
  }
}

function toStored(notePath: string, noteTitle: string, chunk: Chunk): StoredChunk {
  return {
    notePath,
    noteTitle,
    heading: chunk.heading,
    text: chunk.text,
    startLine: chunk.startLine,
  };
}
