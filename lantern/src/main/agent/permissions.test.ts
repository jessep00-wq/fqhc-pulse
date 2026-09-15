import { describe, it, expect } from "vitest";

import {
  classifyCommand,
  decideCommand,
  decideWrite,
  executableName,
  matchesAllowlist,
  tokenizeCommand,
} from "./permissions";

describe("tokenizeCommand", () => {
  it("splits on whitespace and respects quotes", () => {
    expect(tokenizeCommand('git commit -m "a message here"')).toEqual([
      "git",
      "commit",
      "-m",
      "a message here",
    ]);
    expect(tokenizeCommand("echo 'single quoted'")).toEqual(["echo", "single quoted"]);
  });

  it("collapses runs of whitespace", () => {
    expect(tokenizeCommand("  ls   -la  ")).toEqual(["ls", "-la"]);
  });
});

describe("executableName", () => {
  it("strips paths and platform suffixes", () => {
    expect(executableName("/usr/local/bin/git status")).toBe("git");
    expect(executableName("C:\\Windows\\System32\\cmd.exe /c dir")).toBe("cmd");
    expect(executableName("RM -rf /")).toBe("rm");
  });
});

describe("classifyCommand", () => {
  it("treats anything that chains as dangerous", () => {
    for (const command of [
      "ls; rm -rf ~",
      "ls && rm -rf ~",
      "cat file | sh",
      "echo hi > /etc/passwd",
      "echo $(rm -rf /)",
      "echo `whoami`",
    ]) {
      expect(classifyCommand(command).risk, command).toBe("dangerous");
    }
  });

  it("flags destructive executables", () => {
    expect(classifyCommand("rm -rf build").risk).toBe("dangerous");
    expect(classifyCommand("sudo apt install curl").risk).toBe("dangerous");
    expect(classifyCommand("chmod 777 /etc").risk).toBe("dangerous");
  });

  it("flags network tools as caution rather than safe", () => {
    expect(classifyCommand("curl https://example.com").risk).toBe("caution");
    expect(classifyCommand("ssh box uptime").risk).toBe("caution");
  });

  it("allows read-only tools", () => {
    expect(classifyCommand("ls -la").risk).toBe("safe");
    expect(classifyCommand("grep -r needle .").risk).toBe("safe");
    expect(classifyCommand("cat notes.md").risk).toBe("safe");
  });

  it("keeps grep -i safe, because -i means case-insensitive there", () => {
    expect(classifyCommand("grep -i pattern file").risk).toBe("safe");
  });

  it("catches a read-only tool handed a writing flag", () => {
    expect(classifyCommand("find . -delete").risk).toBe("caution");
    expect(classifyCommand("find . -exec touch {} +").risk).toBe("caution");
    expect(classifyCommand("find . -name '*.md'").risk).toBe("safe");
  });

  it("splits git by subcommand", () => {
    expect(classifyCommand("git status").risk).toBe("safe");
    expect(classifyCommand("git log --oneline").risk).toBe("safe");
    expect(classifyCommand("git push --force").risk).toBe("caution");
    expect(classifyCommand("git reset --hard").risk).toBe("caution");
  });

  it("defaults an unknown command to caution, never safe", () => {
    expect(classifyCommand("some-unknown-tool --go").risk).toBe("caution");
    expect(classifyCommand("").risk).toBe("caution");
  });
});

describe("matchesAllowlist", () => {
  const allowlist = ["git log", "ls", "npm test"];

  it("matches on whole tokens, prefix-wise", () => {
    expect(matchesAllowlist("git log --oneline", allowlist)).toBe(true);
    expect(matchesAllowlist("ls -la", allowlist)).toBe(true);
    expect(matchesAllowlist("npm test -- --watch", allowlist)).toBe(true);
  });

  it("does not match a different command that merely starts the same", () => {
    expect(matchesAllowlist("git logrotate", allowlist)).toBe(false);
    expect(matchesAllowlist("lsof -i", allowlist)).toBe(false);
    expect(matchesAllowlist("git push", allowlist)).toBe(false);
  });

  it("does not match when the rule is longer than the command", () => {
    expect(matchesAllowlist("git", allowlist)).toBe(false);
  });
});

describe("decideCommand", () => {
  const allowlist = ["git log", "rm"];

  it("auto-approves safe read-only commands", () => {
    expect(decideCommand("ls -la", []).autoApprove).toBe(true);
    expect(decideCommand("git status", []).autoApprove).toBe(true);
  });

  it("auto-approves an allowlisted command", () => {
    expect(decideCommand("git log --stat", allowlist).autoApprove).toBe(true);
  });

  it("never lets the allowlist override a dangerous classification", () => {
    // `rm` is on the allowlist above and must still stop for a human.
    const decision = decideCommand("rm -rf ~/Documents", allowlist);
    expect(decision.autoApprove).toBe(false);
    expect(decision.risk).toBe("dangerous");
  });

  it("never lets an allowlisted prefix smuggle in a chained command", () => {
    const decision = decideCommand("git log; rm -rf ~", allowlist);
    expect(decision.autoApprove).toBe(false);
    expect(decision.risk).toBe("dangerous");
  });

  it("asks about anything merely unrecognised", () => {
    expect(decideCommand("terraform apply", []).autoApprove).toBe(false);
  });
});

describe("decideWrite", () => {
  const vault = "/home/jess/Vault";

  it("allows writes inside the vault", () => {
    expect(decideWrite("/home/jess/Vault/Inbox/note.md", vault).autoApprove).toBe(true);
    expect(decideWrite("/home/jess/Vault", vault).autoApprove).toBe(true);
  });

  it("asks about writes anywhere else", () => {
    expect(decideWrite("/home/jess/.ssh/authorized_keys", vault).autoApprove).toBe(false);
    expect(decideWrite("/etc/hosts", vault).autoApprove).toBe(false);
  });

  it("is not fooled by a sibling folder sharing the vault's prefix", () => {
    expect(decideWrite("/home/jess/VaultBackup/secret.md", vault).autoApprove).toBe(false);
  });
});
