import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { insertUnderHeading, Vault, VaultError } from "./vault";

describe("insertUnderHeading", () => {
  it("appends the heading when the note does not have it", () => {
    const result = insertUnderHeading("# 2026-03-09\n", "Log", "- 09:15 did a thing");
    expect(result).toContain("## Log");
    expect(result).toContain("- 09:15 did a thing");
  });

  it("adds to the end of an existing section, not the top", () => {
    const source = "# Day\n\n## Log\n\n- 08:00 first\n- 09:00 second\n";
    const result = insertUnderHeading(source, "Log", "- 10:00 third");
    const lines = result.trim().split("\n");
    expect(lines[lines.length - 1]).toBe("- 10:00 third");
  });

  it("does not spill into the next section", () => {
    const source = "## Log\n\n- 08:00 first\n\n## Notes\n\nSomething else\n";
    const result = insertUnderHeading(source, "Log", "- 09:00 second");
    const logIndex = result.indexOf("- 09:00 second");
    const notesIndex = result.indexOf("## Notes");
    expect(logIndex).toBeGreaterThan(-1);
    expect(logIndex).toBeLessThan(notesIndex);
  });

  it("matches the heading regardless of level or case", () => {
    const result = insertUnderHeading("### log\n\n- a\n", "Log", "- b");
    expect(result).not.toContain("## Log");
    expect(result.trim().endsWith("- b")).toBe(true);
  });
});

describe("Vault", () => {
  let root: string;
  let vault: Vault;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "lantern-vault-"));
    vault = new Vault({ root, inboxFolder: "Inbox", dailyFolder: "Daily" });
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  describe("resolve", () => {
    it("resolves paths inside the vault", () => {
      expect(vault.resolve("Notes/a.md")).toBe(path.join(root, "Notes/a.md"));
    });

    it("refuses to escape the vault", () => {
      expect(() => vault.resolve("../outside.md")).toThrow(VaultError);
      expect(() => vault.resolve("Notes/../../outside.md")).toThrow(VaultError);
      expect(() => vault.resolve("../../.ssh/id_rsa")).toThrow(VaultError);
    });

    it("refuses an absolute path", () => {
      expect(() => vault.resolve("/etc/passwd")).toThrow(VaultError);
    });

    it("refuses a sibling folder that shares the vault's prefix", () => {
      expect(() => vault.resolve(`../${path.basename(root)}-backup/x.md`)).toThrow(VaultError);
    });
  });

  it("writes and reads a note", async () => {
    await vault.writeNote("Projects/Test.md", { title: "Test", tags: ["x"] }, "# Test\n\nBody\n");
    const note = await vault.readNote("Projects/Test.md");

    expect(note.title).toBe("Test");
    expect(note.tags).toContain("x");
    expect(note.body).toContain("Body");
    expect(note.path).toBe("Projects/Test.md");
  });

  it("lists only Markdown files and skips Obsidian's own folders", async () => {
    await vault.writeNote("a.md", {}, "a");
    await vault.writeNote("sub/b.md", {}, "b");
    await fs.mkdir(path.join(root, ".obsidian"), { recursive: true });
    await fs.writeFile(path.join(root, ".obsidian", "config.md"), "should be skipped");
    await fs.writeFile(path.join(root, "image.png"), "not markdown");

    expect(await vault.listNotePaths()).toEqual(["a.md", "sub/b.md"]);
  });

  it("appends to today's daily note under a heading", async () => {
    const first = await vault.appendToDailyNote("started the day", "Log", new Date(2026, 2, 9));
    expect(first).toBe("Daily/2026-03-09.md");

    await vault.appendToDailyNote("finished the day", "Log", new Date(2026, 2, 9));
    const note = await vault.readNote("Daily/2026-03-09.md");

    expect(note.body).toContain("started the day");
    expect(note.body).toContain("finished the day");
    expect(note.body.indexOf("started")).toBeLessThan(note.body.indexOf("finished"));
  });

  it("captures a note into the inbox, named from the first line", async () => {
    const written = await vault.captureNote("Call the vendor back\nabout pricing", new Date(2026, 2, 9));
    expect(written).toBe("Inbox/2026-03-09 Call the vendor back.md");

    const note = await vault.readNote(written);
    expect(note.body).toContain("about pricing");
    expect(note.frontmatter.source).toBe("lantern-capture");
  });

  it("does not overwrite an earlier capture with the same opening line", async () => {
    const date = new Date(2026, 2, 9);
    const first = await vault.captureNote("Same opening line", date);
    const second = await vault.captureNote("Same opening line", date);

    expect(second).not.toBe(first);
    expect(second).toBe("Inbox/2026-03-09 Same opening line 2.md");
  });
});
