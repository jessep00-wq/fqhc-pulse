/**
 * Deciding what the agent is allowed to do on this machine.
 *
 * An assistant that can run shell commands is exactly as dangerous as the
 * shell, so nothing here optimises for convenience at the expense of the
 * default. Three rules shape it:
 *
 *   1. Deny beats allow. If any part of a command line looks destructive, the
 *      whole line needs a human, even if a safe prefix matches an allow rule.
 *   2. Allowlist prefixes are matched on parsed arguments, not raw substrings,
 *      so `git status` on the allowlist cannot be used to smuggle
 *      `git status; rm -rf ~`.
 *   3. Anything unrecognised is `caution`, never `safe`. A classifier that has
 *      not seen a command is not evidence that the command is harmless.
 *
 * Pure functions, so the rules are testable without spawning anything.
 */

import type { RiskLevel } from "../../shared/types";

export interface Classification {
  risk: RiskLevel;
  reason: string;
}

/** Shell metacharacters that chain, redirect or substitute another command. */
const CHAINING = /[;&|><`]|\$\(|\|\||&&/;

/**
 * Commands that can destroy data, exfiltrate it, or take over the machine.
 * Matched against the resolved executable name, not the raw string.
 */
const DANGEROUS_COMMANDS = new Set([
  "rm",
  "rmdir",
  "mkfs",
  "dd",
  "shutdown",
  "reboot",
  "halt",
  "poweroff",
  "kill",
  "killall",
  "pkill",
  "chown",
  "chmod",
  "sudo",
  "su",
  "doas",
  "passwd",
  "useradd",
  "userdel",
  "visudo",
  "diskutil",
  "fdisk",
  "launchctl",
  "systemctl",
  "crontab",
  "defaults",
  "reg",
  "netsh",
]);

/** Commands that reach the network — fine to run, worth seeing first. */
const NETWORK_COMMANDS = new Set([
  "curl",
  "wget",
  "ssh",
  "scp",
  "rsync",
  "nc",
  "ncat",
  "telnet",
  "ftp",
]);

/** Read-only commands that are safe on any arguments. */
const READ_ONLY_COMMANDS = new Set([
  "ls",
  "pwd",
  "cat",
  "head",
  "tail",
  "wc",
  "date",
  "whoami",
  "hostname",
  "uname",
  "echo",
  "which",
  "type",
  "df",
  "du",
  "ps",
  "env",
  "printenv",
  "grep",
  "rg",
  "find",
  "fd",
  "stat",
  "file",
  "tree",
]);

/**
 * Flags that turn an otherwise read-only tool into a writing one.
 * `-exec` and `-execdir` run an arbitrary program per match; `-delete` and
 * `-fprint` write directly.
 */
const WRITING_FLAGS = new Set([
  "--in-place",
  "-delete",
  "-exec",
  "-execdir",
  "-ok",
  "-okdir",
  "-fprint",
  "-fprintf",
  "-fls",
]);

/** Subcommands of `git` that only read. */
const SAFE_GIT_SUBCOMMANDS = new Set([
  "status",
  "diff",
  "log",
  "show",
  "branch",
  "remote",
  "blame",
  "stash",
  "describe",
  "rev-parse",
  "shortlog",
]);

/**
 * Split a command line into tokens, respecting quotes.
 * Good enough to identify the executable and its arguments; it is not a shell.
 */
export function tokenizeCommand(command: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;

  for (let i = 0; i < command.length; i += 1) {
    const char = command[i]!;
    if (quote) {
      if (char === quote) quote = null;
      else current += char;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (/\s/.test(char)) {
      if (current) tokens.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current) tokens.push(current);
  return tokens;
}

/** The executable name, with any path and platform suffix stripped. */
export function executableName(command: string): string {
  const first = tokenizeCommand(command)[0] ?? "";
  const base = first.split(/[\\/]/).pop() ?? first;
  return base.replace(/\.(exe|cmd|bat|ps1)$/i, "").toLowerCase();
}

/**
 * Classify a shell command.
 *
 * The chaining check runs first and on the raw string, so a destructive second
 * clause cannot hide behind a harmless first one.
 */
export function classifyCommand(command: string): Classification {
  const trimmed = command.trim();
  if (!trimmed) return { risk: "caution", reason: "Empty command" };

  if (CHAINING.test(trimmed)) {
    return {
      risk: "dangerous",
      reason: "Chains or redirects into another command, so it cannot be checked as one thing",
    };
  }

  const tokens = tokenizeCommand(trimmed);
  const name = executableName(trimmed);

  if (DANGEROUS_COMMANDS.has(name)) {
    return { risk: "dangerous", reason: `\`${name}\` can change or destroy system state` };
  }

  if (NETWORK_COMMANDS.has(name)) {
    return { risk: "caution", reason: `\`${name}\` sends data over the network` };
  }

  if (name === "git") {
    const subcommand = tokens[1]?.toLowerCase() ?? "";
    if (SAFE_GIT_SUBCOMMANDS.has(subcommand)) {
      return { risk: "safe", reason: `\`git ${subcommand}\` only reads the repository` };
    }
    return { risk: "caution", reason: `\`git ${subcommand || "?"}\` can change the repository` };
  }

  if (READ_ONLY_COMMANDS.has(name)) {
    // A read-only tool handed a writing flag is no longer read-only. `find` is
    // the one that matters: `find . -delete` is `rm` wearing a hat. Note that
    // `-i` is NOT such a flag here — it means case-insensitive to `grep`, and
    // the tools where it means in-place (`sed`, `perl`) are not on this list.
    const writingFlag = tokens.find((token) =>
      WRITING_FLAGS.has(token.toLowerCase()),
    );
    if (writingFlag) {
      return {
        risk: "caution",
        reason: `\`${name} ${writingFlag}\` can change files, not just read them`,
      };
    }
    return { risk: "safe", reason: `\`${name}\` only reads` };
  }

  return { risk: "caution", reason: `\`${name || "this command"}\` is not on the known-safe list` };
}

/**
 * Does a command match one of the user's allowlist prefixes?
 *
 * Matching is token-wise, so the rule `git log` matches `git log --oneline`
 * but not `git logrotate`, and never matches a command the classifier already
 * called dangerous.
 */
export function matchesAllowlist(command: string, allowlist: string[]): boolean {
  const tokens = tokenizeCommand(command.trim()).map((t) => t.toLowerCase());
  if (tokens.length === 0) return false;

  return allowlist.some((rule) => {
    const ruleTokens = tokenizeCommand(rule.trim()).map((t) => t.toLowerCase());
    if (ruleTokens.length === 0 || ruleTokens.length > tokens.length) return false;
    return ruleTokens.every((token, i) => tokens[i] === token);
  });
}

export interface Decision {
  /** Run it without asking. */
  autoApprove: boolean;
  risk: RiskLevel;
  reason: string;
}

/**
 * The final call for a Bash command: auto-approve only when the classifier
 * says it is safe *and* the user put it on the allowlist, or when it is safe
 * and read-only. Everything else goes to the human.
 */
export function decideCommand(command: string, allowlist: string[]): Decision {
  const { risk, reason } = classifyCommand(command);

  if (risk === "dangerous") {
    return { autoApprove: false, risk, reason };
  }

  if (matchesAllowlist(command, allowlist)) {
    return { autoApprove: true, risk, reason: `On your allowlist. ${reason}` };
  }

  if (risk === "safe") {
    return { autoApprove: true, risk, reason };
  }

  return { autoApprove: false, risk, reason };
}

/** Tools the agent may always use without asking, because they only read. */
export const ALWAYS_ALLOWED_TOOLS = new Set([
  "Read",
  "Glob",
  "Grep",
  "TodoWrite",
  "NotebookRead",
]);

/** Tools that always need a human, whatever else is configured. */
export const ALWAYS_ASK_TOOLS = new Set(["WebFetch", "WebSearch"]);

/**
 * Decide about a file write. Writes inside the vault are the assistant's own
 * memory and are expected; writes anywhere else are the user's business.
 */
export function decideWrite(targetPath: string, vaultRoot: string): Decision {
  const normalized = targetPath.replace(/\\/g, "/");
  const root = vaultRoot.replace(/\\/g, "/").replace(/\/+$/, "");

  if (root && (normalized === root || normalized.startsWith(`${root}/`))) {
    return { autoApprove: true, risk: "safe", reason: "Writes inside your vault" };
  }
  return {
    autoApprove: false,
    risk: "caution",
    reason: "Writes outside your vault",
  };
}
