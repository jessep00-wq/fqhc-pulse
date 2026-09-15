/**
 * Turning text into vectors, locally.
 *
 * Two backends behind one interface:
 *
 *   TransformersEmbedder — a real sentence-embedding model (all-MiniLM-L6-v2)
 *   run through ONNX on the CPU. Nothing leaves the machine. The model is
 *   ~25MB and is fetched once on first use, which is the only moment Lantern
 *   touches the network for retrieval.
 *
 *   LexicalEmbedder — a deterministic hashed bag-of-words with no model and no
 *   download. It is the fallback when the optional dependency is absent or the
 *   model has not arrived yet, and it is what the tests run against.
 *
 * The fallback is not a placeholder. Retrieval combines vector similarity with
 * BM25 keyword scoring (see ./search.ts), so with the lexical backend the app
 * degrades to good keyword search rather than to nothing.
 */

export interface Embedder {
  readonly id: "transformers" | "lexical";
  readonly dimensions: number;
  /** Embed a batch. Returns one unit-length vector per input, in order. */
  embed(texts: string[]): Promise<Float32Array[]>;
}

/** Scale a vector to unit length so cosine similarity is a plain dot product. */
export function normalize(vector: Float32Array): Float32Array {
  let sum = 0;
  for (const value of vector) sum += value * value;
  const magnitude = Math.sqrt(sum);
  if (magnitude === 0) return vector;
  const out = new Float32Array(vector.length);
  for (let i = 0; i < vector.length; i += 1) out[i] = vector[i]! / magnitude;
  return out;
}

/** Dot product. Only equals cosine similarity for unit-length vectors. */
export function dot(a: Float32Array, b: Float32Array): number {
  const length = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < length; i += 1) sum += a[i]! * b[i]!;
  return sum;
}

/** Split text into lowercase word tokens, dropping punctuation. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter((token) => token.length > 1);
}

/** FNV-1a, for stable bucket assignment without a dependency. */
function hash(token: string): number {
  let value = 0x811c9dc5;
  for (let i = 0; i < token.length; i += 1) {
    value ^= token.charCodeAt(i);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
}

/**
 * Hashed bag-of-words with sublinear term weighting.
 *
 * Each token lands in a fixed bucket; a second hash decides its sign so that
 * unrelated tokens colliding in one bucket tend to cancel rather than compound.
 * Repeated terms are damped with 1 + log(count), the same intuition BM25 uses.
 */
export class LexicalEmbedder implements Embedder {
  readonly id = "lexical" as const;

  constructor(readonly dimensions = 512) {}

  async embed(texts: string[]): Promise<Float32Array[]> {
    return texts.map((text) => this.embedOne(text));
  }

  private embedOne(text: string): Float32Array {
    const counts = new Map<string, number>();
    for (const token of tokenize(text)) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }

    const vector = new Float32Array(this.dimensions);
    for (const [token, count] of counts) {
      const h = hash(token);
      const bucket = h % this.dimensions;
      const sign = (h >>> 16) % 2 === 0 ? 1 : -1;
      vector[bucket] = vector[bucket]! + sign * (1 + Math.log(count));
    }
    return normalize(vector);
  }
}

/** Minimal shape of the transformers feature-extraction pipeline we rely on. */
type FeatureExtractor = (
  texts: string[],
  options: { pooling: "mean"; normalize: boolean },
) => Promise<{ dims: number[]; data: Float32Array | number[] }>;

/**
 * Local sentence embeddings via `@huggingface/transformers`.
 *
 * The dependency is optional and the import is dynamic, so a machine that
 * never installed it — or an offline first run — falls back cleanly instead of
 * failing to start.
 */
export class TransformersEmbedder implements Embedder {
  readonly id = "transformers" as const;
  readonly dimensions = 384;

  private extractor: FeatureExtractor | null = null;

  constructor(private readonly modelId = "Xenova/all-MiniLM-L6-v2") {}

  /**
   * Load the model. Resolves false when the optional dependency or the model
   * is unavailable, which the caller treats as "use the lexical backend".
   */
  async load(): Promise<boolean> {
    if (this.extractor) return true;
    try {
      const mod = (await import(
        /* @vite-ignore */ "@huggingface/transformers"
      )) as unknown as {
        pipeline: (task: string, model: string) => Promise<FeatureExtractor>;
      };
      this.extractor = await mod.pipeline("feature-extraction", this.modelId);
      return true;
    } catch {
      this.extractor = null;
      return false;
    }
  }

  async embed(texts: string[]): Promise<Float32Array[]> {
    if (!this.extractor) {
      throw new Error("TransformersEmbedder.load() must succeed before embedding");
    }
    const output = await this.extractor(texts, { pooling: "mean", normalize: true });
    const width = output.dims[output.dims.length - 1] ?? this.dimensions;
    const flat = output.data instanceof Float32Array ? output.data : Float32Array.from(output.data);

    const vectors: Float32Array[] = [];
    for (let i = 0; i < texts.length; i += 1) {
      vectors.push(normalize(flat.slice(i * width, (i + 1) * width)));
    }
    return vectors;
  }
}

/**
 * Pick the best backend available on this machine, preferring real embeddings
 * and falling back without complaint.
 */
export async function createEmbedder(preferLocalModel = true): Promise<Embedder> {
  if (preferLocalModel) {
    const transformers = new TransformersEmbedder();
    if (await transformers.load()) return transformers;
  }
  return new LexicalEmbedder();
}
