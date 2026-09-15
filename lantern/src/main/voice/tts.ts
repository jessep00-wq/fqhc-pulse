/**
 * Text to speech, locally.
 *
 * Prefers a configured piper binary; otherwise falls back to whatever the OS
 * already has — `say` on macOS, PowerShell's speech synthesiser on Windows,
 * `espeak-ng` or `spd-say` on Linux. All of them are offline.
 *
 * Every path spawns with an argument array and never a shell string, so text
 * that came from a model cannot become a command.
 */

import { spawn, type ChildProcess } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

export interface TtsOptions {
  binary: string;
  model: string;
}

/**
 * Strip Markdown so the voice does not read punctuation aloud.
 *
 * The system prompt already asks for speech-shaped replies, but models drift
 * back to asterisks and backticks, and "star star important star star" is a
 * uniquely irritating way to find out.
 */
export function spokenForm(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " code block ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target: string, alias?: string) => alias ?? target)
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export class Speaker {
  private current: ChildProcess | null = null;

  /** Stop whatever is being said right now. */
  stop(): void {
    if (!this.current) return;
    try {
      this.current.kill("SIGTERM");
    } catch {
      // Already gone.
    }
    this.current = null;
  }

  /**
   * Speak text aloud. Resolves when playback finishes or is interrupted.
   * A missing voice binary is not an error worth surfacing to the user: the
   * text is already on screen.
   */
  async speak(text: string, options: TtsOptions): Promise<void> {
    const spoken = spokenForm(text);
    if (!spoken) return;

    this.stop();

    if (options.binary && options.model) {
      try {
        await this.speakWithPiper(spoken, options);
        return;
      } catch {
        // Fall through to the OS voice.
      }
    }

    await this.speakWithSystemVoice(spoken);
  }

  /** Piper writes a WAV, which the OS then plays. */
  private async speakWithPiper(text: string, options: TtsOptions): Promise<void> {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "lantern-tts-"));
    const wavPath = path.join(dir, "speech.wav");
    try {
      await this.run(options.binary, ["--model", options.model, "--output_file", wavPath], text);
      const player = playerFor(wavPath);
      if (player) await this.run(player.binary, player.args);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  }

  private async speakWithSystemVoice(text: string): Promise<void> {
    if (process.platform === "darwin") {
      await this.run("say", [text]);
      return;
    }

    if (process.platform === "win32") {
      // -Command takes the script as one argument; the text is passed through
      // an environment variable so quotes in it cannot terminate the string.
      await this.run(
        "powershell",
        [
          "-NoProfile",
          "-Command",
          "Add-Type -AssemblyName System.Speech; " +
            "(New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak($env:LANTERN_SPEAK)",
        ],
        undefined,
        { LANTERN_SPEAK: text },
      );
      return;
    }

    try {
      await this.run("espeak-ng", [text]);
    } catch {
      await this.run("spd-say", ["-w", text]);
    }
  }

  private run(
    binary: string,
    args: string[],
    stdin?: string,
    extraEnv?: Record<string, string>,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(binary, args, {
        stdio: [stdin === undefined ? "ignore" : "pipe", "ignore", "pipe"],
        env: extraEnv ? { ...process.env, ...extraEnv } : process.env,
      });
      this.current = child;

      let stderr = "";
      child.stderr?.on("data", (chunk) => {
        stderr += String(chunk);
      });

      child.on("error", (error) => {
        if (this.current === child) this.current = null;
        reject(error);
      });

      child.on("close", (code, signal) => {
        if (this.current === child) this.current = null;
        // A kill from stop() is an interruption, not a failure.
        if (signal) resolve();
        else if (code === 0) resolve();
        else reject(new Error(`${binary} exited ${code}: ${stderr.slice(0, 200)}`));
      });

      if (stdin !== undefined && child.stdin) {
        child.stdin.end(stdin);
      }
    });
  }
}

/** The OS command that plays a WAV file, if there is an obvious one. */
function playerFor(wavPath: string): { binary: string; args: string[] } | null {
  if (process.platform === "darwin") return { binary: "afplay", args: [wavPath] };
  if (process.platform === "win32") {
    return {
      binary: "powershell",
      args: [
        "-NoProfile",
        "-Command",
        `(New-Object Media.SoundPlayer '${wavPath.replace(/'/g, "''")}').PlaySync()`,
      ],
    };
  }
  return { binary: "aplay", args: [wavPath] };
}
