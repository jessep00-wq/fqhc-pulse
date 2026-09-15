/**
 * Speech to text, locally.
 *
 * The renderer captures microphone audio with the Web Audio API and hands the
 * main process raw Float32 PCM. This module resamples it to the 16kHz mono
 * 16-bit WAV that whisper.cpp expects, writes a temp file, and runs the binary
 * the user pointed at in settings.
 *
 * No binary configured means no transcription — deliberately. Silently posting
 * audio to a cloud service would betray the whole point of the app, so the
 * failure is explicit and the setup instructions are in the error.
 */

import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

export class TranscriptionUnavailable extends Error {}

export interface SttOptions {
  binary: string;
  model: string;
}

/** Whisper's expected input rate. Everything is resampled to this. */
const TARGET_RATE = 16_000;

/**
 * Resample mono Float32 audio with linear interpolation.
 *
 * Linear interpolation is not the best resampler in the abstract, but speech
 * headed for an ASR model at 16kHz does not measurably benefit from a windowed
 * sinc here, and this adds no dependency.
 */
export function resampleMono(input: Float32Array, fromRate: number, toRate = TARGET_RATE): Float32Array {
  if (fromRate === toRate || input.length === 0) return input;

  const ratio = fromRate / toRate;
  const length = Math.max(1, Math.floor(input.length / ratio));
  const output = new Float32Array(length);

  for (let i = 0; i < length; i += 1) {
    const position = i * ratio;
    const left = Math.floor(position);
    const right = Math.min(left + 1, input.length - 1);
    const weight = position - left;
    output[i] = input[left]! * (1 - weight) + input[right]! * weight;
  }

  return output;
}

/** Wrap mono 16-bit PCM in a RIFF/WAVE container. */
export function encodeWav(samples: Float32Array, sampleRate = TARGET_RATE): Buffer {
  const header = Buffer.alloc(44);
  const dataLength = samples.length * 2;

  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + dataLength, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // format: PCM
  header.writeUInt16LE(1, 22); // channels: mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write("data", 36, "ascii");
  header.writeUInt32LE(dataLength, 40);

  const body = Buffer.alloc(dataLength);
  for (let i = 0; i < samples.length; i += 1) {
    // Clamp before scaling so a hot mic clips rather than wrapping around into
    // noise, which is what an unclamped conversion does at peaks.
    const clamped = Math.max(-1, Math.min(1, samples[i]!));
    body.writeInt16LE(Math.round(clamped * 32767), i * 2);
  }

  return Buffer.concat([header, body]);
}

/**
 * Strip whisper.cpp's console output down to the transcript.
 *
 * The CLI prints `[00:00:00.000 --> 00:00:02.000]  text` lines plus a banner
 * and timing block on stderr. Timestamped lines are the only ones that matter.
 */
export function parseWhisperOutput(stdout: string): string {
  const lines = stdout.split("\n");
  const spoken: string[] = [];

  for (const line of lines) {
    const match = /^\[\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}\]\s*(.*)$/.exec(
      line.trim(),
    );
    if (match?.[1]) {
      spoken.push(match[1].trim());
      continue;
    }
    // Some builds print the bare transcript with no timestamps at all.
    const bare = line.trim();
    if (spoken.length === 0 && bare && !bare.startsWith("[") && !/^whisper_/.test(bare)) {
      spoken.push(bare);
    }
  }

  return spoken
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/\[BLANK_AUDIO\]|\(.*?\)/g, "")
    .trim();
}

/** Transcribe PCM audio. Throws TranscriptionUnavailable when unconfigured. */
export async function transcribe(
  samples: Float32Array,
  sampleRate: number,
  options: SttOptions,
): Promise<string> {
  if (!options.binary || !options.model) {
    throw new TranscriptionUnavailable(
      "Local speech recognition is not set up. Point Lantern at a whisper.cpp binary " +
        "and a model file in Settings.",
    );
  }

  const resampled = resampleMono(samples, sampleRate);
  if (resampled.length < TARGET_RATE / 4) return ""; // Under 250ms is not speech.

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "lantern-stt-"));
  const wavPath = path.join(dir, "input.wav");

  try {
    await fs.writeFile(wavPath, encodeWav(resampled));
    const stdout = await run(options.binary, [
      "-m",
      options.model,
      "-f",
      wavPath,
      "--no-timestamps",
      "--language",
      "en",
    ]);
    return parseWhisperOutput(stdout);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

/** Run a binary and resolve its stdout. Arguments are passed as an array, never a shell string. */
function run(binary: string, args: string[], timeoutMs = 120_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`${path.basename(binary)} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(stdout);
      else reject(new Error(`${path.basename(binary)} exited ${code}: ${stderr.slice(0, 500)}`));
    });
  });
}
