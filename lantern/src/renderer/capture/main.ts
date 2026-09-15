/**
 * The quick-capture widget.
 *
 * One job: get a thought out of the user's head and into the vault inbox
 * before it evaporates, without making them decide where it goes. Enter saves,
 * Escape dismisses, and the window closes itself afterwards so the flow is
 * hotkey, type, Enter, back to whatever you were doing.
 */

const textarea = document.getElementById("text") as HTMLTextAreaElement | null;
const saveButton = document.getElementById("save") as HTMLButtonElement | null;
const hint = document.getElementById("hint");

if (!textarea || !saveButton || !hint) {
  throw new Error("Capture window is missing its elements");
}

let saving = false;

function setHint(message: string, tone: "normal" | "good" | "bad" = "normal"): void {
  hint!.textContent = message;
  hint!.className = tone === "normal" ? "hint" : "status";
}

async function save(): Promise<void> {
  const text = textarea!.value.trim();
  if (!text || saving) return;

  saving = true;
  saveButton!.disabled = true;
  setHint("Saving…");

  try {
    const { path } = await window.lantern.captureNote(text);
    textarea!.value = "";
    setHint(`Saved to ${path}`, "good");
    // Long enough to register, short enough not to be in the way.
    setTimeout(() => void window.lantern.closeCapture(), 700);
  } catch (error) {
    setHint(error instanceof Error ? error.message : "Could not save", "bad");
  } finally {
    saving = false;
    saveButton!.disabled = false;
  }
}

saveButton.addEventListener("click", () => void save());

textarea.addEventListener("keydown", (event) => {
  // Enter saves; Shift+Enter is a newline, because some thoughts have two lines.
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    void save();
    return;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    void window.lantern.closeCapture();
  }
});

// The window is reused rather than recreated, so reset it each time it opens.
window.addEventListener("focus", () => {
  setHint("Enter to save · Esc to dismiss");
  textarea.focus();
});

textarea.focus();
