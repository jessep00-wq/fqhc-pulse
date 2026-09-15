/**
 * User settings, stored as JSON in Electron's userData directory.
 *
 * Settings are read constantly (every permission check reads the allowlist) and
 * written rarely, so the whole file is held in memory and flushed on change.
 * A corrupt or partial file falls back to defaults rather than refusing to
 * launch — being locked out of your own assistant by a bad JSON byte is worse
 * than losing a preference.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

import { DEFAULT_CONFIG, type LanternConfig } from "../shared/types";

export class ConfigStore {
  private current: LanternConfig = { ...DEFAULT_CONFIG };
  private readonly file: string;

  constructor(userDataDir: string) {
    this.file = path.join(userDataDir, "config.json");
  }

  get(): LanternConfig {
    return { ...this.current };
  }

  async load(): Promise<LanternConfig> {
    try {
      const raw = await fs.readFile(this.file, "utf8");
      const parsed = JSON.parse(raw) as Partial<LanternConfig>;
      this.current = sanitize({ ...DEFAULT_CONFIG, ...parsed });
    } catch {
      this.current = { ...DEFAULT_CONFIG };
    }
    return this.get();
  }

  async set(patch: Partial<LanternConfig>): Promise<LanternConfig> {
    this.current = sanitize({ ...this.current, ...patch });
    await this.save();
    return this.get();
  }

  private async save(): Promise<void> {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    const temp = `${this.file}.tmp`;
    await fs.writeFile(temp, JSON.stringify(this.current, null, 2), "utf8");
    await fs.rename(temp, this.file);
  }
}

/**
 * Coerce anything that came off disk into a usable config.
 *
 * The allowlist gets the strictest treatment: it is a security boundary, so a
 * malformed entry is dropped rather than interpreted generously.
 */
function sanitize(config: LanternConfig): LanternConfig {
  return {
    ...config,
    vaultPath: typeof config.vaultPath === "string" ? config.vaultPath : "",
    inboxFolder: cleanFolder(config.inboxFolder, DEFAULT_CONFIG.inboxFolder),
    dailyFolder: cleanFolder(config.dailyFolder, DEFAULT_CONFIG.dailyFolder),
    model: typeof config.model === "string" && config.model ? config.model : DEFAULT_CONFIG.model,
    hotkeyTalk: typeof config.hotkeyTalk === "string" ? config.hotkeyTalk : DEFAULT_CONFIG.hotkeyTalk,
    hotkeyCapture:
      typeof config.hotkeyCapture === "string" ? config.hotkeyCapture : DEFAULT_CONFIG.hotkeyCapture,
    voiceOutput: Boolean(config.voiceOutput),
    screenReading: Boolean(config.screenReading),
    allowedCommands: Array.isArray(config.allowedCommands)
      ? config.allowedCommands
          .filter((entry): entry is string => typeof entry === "string")
          .map((entry) => entry.trim())
          .filter((entry) => entry.length > 0 && !/[;&|><`$]/.test(entry))
      : [...DEFAULT_CONFIG.allowedCommands],
    sttBinary: typeof config.sttBinary === "string" ? config.sttBinary : "",
    sttModel: typeof config.sttModel === "string" ? config.sttModel : "",
    ttsBinary: typeof config.ttsBinary === "string" ? config.ttsBinary : "",
    ttsModel: typeof config.ttsModel === "string" ? config.ttsModel : "",
  };
}

/** Normalise a vault-relative folder: no leading, trailing or doubled slashes. */
function cleanFolder(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const cleaned = value.replace(/\\/g, "/").replace(/\/{2,}/g, "/").replace(/^\/+|\/+$/g, "");
  if (!cleaned || cleaned.split("/").includes("..")) return fallback;
  return cleaned;
}
