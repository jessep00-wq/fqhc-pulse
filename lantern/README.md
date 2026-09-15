# Lantern

A local-first voice assistant with a particle-orb interface and an Obsidian vault for long-term memory. Powered by Claude.

Lantern sits in your tray as a glowing orb. You press a shortcut, talk to it, and it answers out loud. It remembers what you tell it by writing Markdown into a folder you own, searches that folder before it answers anything about your life, reads your screen when you ask it to, and runs commands on your machine — behind a permission gate that assumes nothing is safe until it has checked.

Everything except the model runs on your computer. Your notes are never uploaded. Speech recognition and speech synthesis are local binaries. The search index lives in a dotfolder inside your vault and can be deleted at any time.

---

## Honest status

This is a working codebase, not a shipped product. Be aware of what has and has not been exercised:

| Area | State |
| --- | --- |
| Vault read/write, daily notes, capture | Covered by tests, exercised against a real temp vault |
| Chunking, hybrid retrieval, ranking | Covered by tests |
| Command permission classifier | Covered by tests, including the bypass attempts it must refuse |
| Audio encoding, whisper output parsing, spoken-form stripping | Covered by tests |
| WebGL orb | Rendered in a real browser and checked by eye in all six states |
| Electron app end to end | **Not yet run.** It typechecks and builds; nobody has launched it |
| Microphone, screen capture, global hotkeys, tray | **Not yet run.** These need a desktop session |
| Local speech recognition | **Not yet run** against a real whisper build |

The parts that have never executed are the parts that need a real desktop, a microphone and a display. Expect to fix things on first launch.

---

## Requirements

- Node 20 or newer
- An `ANTHROPIC_API_KEY` in your environment
- An Obsidian vault, or any folder of Markdown files
- For speech input: a [whisper.cpp](https://github.com/ggml-org/whisper.cpp) build and a model file
- For speech output: nothing. Piper is supported if you want a better voice than your operating system's

Anthropic does not permit third-party products to authenticate with a claude.ai login, so Lantern uses an API key. That is a per-token cost, separate from any Claude subscription.

## Running it

```sh
npm install
export ANTHROPIC_API_KEY=sk-ant-...
npm run dev
```

On first launch the console window opens with no vault set. Choose one, and Lantern indexes it in the background.

Other commands:

```sh
npm run typecheck     # tsc across main, preload and renderer
npm test              # the logic suite
npm run build         # production build into out/
npm run orb:preview   # build the orb harness; serve tools/orb-preview/dist to see it
```

---

## How it is put together

```
src/
  main/            the only process with filesystem, shell and model access
    agent/         the Claude Agent SDK session, vault tools, permission broker
    rag/           chunking, embeddings, the vector index, hybrid search
    vault/         Markdown parsing and the vault itself
    voice/         whisper.cpp and piper adapters
    windows.ts     the orb, capture and console windows
  preload/         the one file that sees both ipcRenderer and the page
  renderer/
    orb/           WebGL2 particle orb and microphone capture
    capture/       the quick-capture widget
    console/       transcript, approvals and settings
  shared/          types and the IPC contract, compiled into all three processes
```

### Memory is a folder, not a database

The assistant's memory is your vault. Lantern writes plain Markdown with YAML frontmatter into folders you choose:

```
YourVault/
  Inbox/     2026-03-09 Call the vendor back.md    ← quick captures
  Daily/     2026-03-09.md                          ← timestamped log lines
  Memory/    Pricing decision.md                    ← things it was told to remember
  .lantern/  index.json                             ← the search index, safe to delete
```

Open the same folder in Obsidian and everything is there, linkable and editable. If Lantern disappears tomorrow, the memory is still a vault. That constraint is the point, and it is why there is no database.

### Retrieval is keyword *and* semantic

Vector search alone is bad at proper nouns: ask about "Athena" and a semantic model returns passages about clinical workflows that never mention Athena. Keyword search alone is bad at paraphrase. Lantern runs both and fuses the ranks with reciprocal rank fusion, which needs no score calibration and stays stable as the vault grows.

Embeddings come from `all-MiniLM-L6-v2` running locally through ONNX. The model is an optional dependency and downloads once, about 25MB. Until it arrives — or if you never install it — retrieval falls back to BM25 keyword search, and the console tells you which mode you are in. The fallback is a real fallback, not a stub.

Chunks follow headings rather than a character window, and each one carries its note title and heading path into the embedding, so a `## Pricing` section matches a question about pricing even when the prose never repeats the word.

### The permission gate

The agent has the Agent SDK's built-in tools, which include running shell commands. That is as dangerous as it sounds, so every call that is not a plain read passes through `src/main/agent/permissions.ts`:

- **Anything that chains is dangerous.** A command containing `;`, `&&`, `|`, a redirect, a backtick or `$(...)` cannot be checked as one thing, so it always asks. This is what stops an allowlisted `git log` from carrying `; rm -rf ~` in behind it.
- **Deny beats allow.** Putting `rm` on your allowlist does not make `rm -rf ~/Documents` auto-approve. The classifier's verdict wins.
- **Allowlist matching is token-wise.** The rule `git log` matches `git log --oneline` and never `git logrotate`.
- **Unknown means ask.** A command the classifier has not seen is `caution`, never `safe`. Not recognising something is not evidence that it is harmless.
- **Writes inside the vault are free; writes outside it ask.** The vault is the assistant's own memory. Your home directory is not.
- Vault paths are resolved through one chokepoint that rejects anything escaping the vault root, so a tool call asking for `../../.ssh/id_rsa` dies before it reaches the filesystem.

"Allow for this session" is session-scoped and never written to disk. Persisting a rule is a settings change, and settings changes belong in settings.

### The orb

WebGL2, no third-party library, because the app has to work with the network off. About 22,000 points on a Fibonacci sphere, displaced each frame by three octaves of value noise sampled in object space, and pushed outward by your voice. Additive blending means density at the centre produces the glow with no second pass.

Each agent state has its own palette and churn rate, eased over roughly a third of a second so the orb reads as reacting rather than as a status light. `tools/orb-preview` renders all six side by side in a browser, which is the only honest way to check a shader.

---

## Configuration

Settings live in the console window and are stored as JSON in Electron's userData directory.

| Setting | Notes |
| --- | --- |
| Vault folder | Any folder of Markdown |
| Inbox / Daily folders | Where captures and daily logs go |
| Model | Defaults to `claude-opus-5` |
| Talk / capture shortcuts | Global, default `Cmd/Ctrl+Shift+Space` and `Cmd/Ctrl+Shift+N` |
| Speak answers aloud | Piper if configured, otherwise the OS voice |
| whisper binary and model | Required for speech input; there is no cloud fallback by design |
| Screen reading | Off means the screen tool returns nothing rather than a picture |
| Allowlisted commands | One prefix per line |

---

## Moving this into its own repository

Lantern currently lives in a `lantern/` subdirectory of another project, because the session that wrote it could not create a repository. It has no dependency on its parent and is meant to stand alone:

```sh
git subtree split --prefix=lantern -b lantern-only
mkdir ../lantern && cd ../lantern && git init
git pull ../<parent-repo> lantern-only
```

Then push to a new empty repository and delete the `lantern/` directory from the parent.

---

## Licence

MIT. See [LICENSE](./LICENSE).

Built on the [Claude Agent SDK](https://code.claude.com/docs/en/agent-sdk). Lantern is not an Anthropic product and is not affiliated with Anthropic.
