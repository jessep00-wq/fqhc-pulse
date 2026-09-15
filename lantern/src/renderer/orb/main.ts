/**
 * The orb window's entry point: wires the renderer and the microphone to the
 * main process.
 *
 * Click-through is the fiddly part. The window is a 260px square of mostly
 * nothing, and a square of nothing that eats clicks in the corner of the
 * screen is infuriating. The window ignores mouse events by default, and the
 * page re-enables them only while the pointer is actually within the orb's
 * radius, using the forwarded move events Electron sends through.
 */

import type { AgentState } from "../../shared/types";
import { VoiceCapture } from "./audio";
import { Orb } from "./orb";

declare global {
  interface Window {
    orbPointer: { setInteractive: (interactive: boolean) => void };
  }
}

const canvasElement = document.getElementById("orb") as HTMLCanvasElement | null;
const caption = document.getElementById("caption");
if (!canvasElement) throw new Error("Orb canvas is missing from the document");

/** Narrowed once here so the closures below do not each need a null check. */
const canvas: HTMLCanvasElement = canvasElement;

const orb = new Orb(canvas);
orb.start();

let state: AgentState = "idle";
let capture: VoiceCapture | null = null;
let interactive = false;

function setState(next: AgentState): void {
  state = next;
  orb.setState(next);
  document.body.dataset.state = next;
}

function setCaption(text: string): void {
  if (!caption) return;
  caption.textContent = text;
  caption.classList.toggle("visible", text.length > 0);
}

/** Radius, in CSS pixels, within which the orb accepts the pointer. */
function orbRadius(): number {
  return Math.min(canvas.clientWidth, canvas.clientHeight) / 2 - 8;
}

window.addEventListener("mousemove", (event) => {
  const centerX = canvas.clientWidth / 2;
  const centerY = canvas.clientHeight / 2;
  const inside = Math.hypot(event.clientX - centerX, event.clientY - centerY) <= orbRadius();

  if (inside !== interactive) {
    interactive = inside;
    window.orbPointer.setInteractive(inside);
    document.body.classList.toggle("hot", inside);
  }
});

/** Begin an utterance: record, transcribe, hand to the brain. */
async function listen(): Promise<void> {
  if (capture?.isActive) return;

  capture = new VoiceCapture({
    onLevel: (level) => orb.setLevel(level),
    onSpeechStart: () => setCaption("Listening…"),
  });

  setState("listening");
  setCaption("Listening…");
  await window.lantern.startListening();

  try {
    const utterance = await capture.record();
    orb.setLevel(0);

    if (utterance.samples.length === 0) {
      setState("idle");
      setCaption("");
      return;
    }

    setState("thinking");
    setCaption("Transcribing…");
    await window.lantern.stopListening();

    // Transfer the PCM rather than copying it; utterances are megabytes.
    const buffer = utterance.samples.buffer.slice(
      utterance.samples.byteOffset,
      utterance.samples.byteOffset + utterance.samples.byteLength,
    ) as ArrayBuffer;
    const text = await window.lantern.transcribe(buffer, utterance.sampleRate);

    if (!text.trim()) {
      setState("idle");
      setCaption("");
      return;
    }

    setCaption(text);
    await window.lantern.ask({ text });
  } catch (error) {
    setState("error");
    setCaption(error instanceof Error ? error.message : "Something went wrong");
    setTimeout(() => {
      setState("idle");
      setCaption("");
    }, 4000);
  } finally {
    capture = null;
  }
}

// Clicking the orb starts listening, or stops a turn that is already running.
canvas.addEventListener("click", () => {
  if (state === "listening") capture?.stop();
  else if (state === "thinking" || state === "speaking" || state === "working") {
    void window.lantern.interrupt();
  } else void listen();
});

canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  void window.lantern.openConsole();
});

window.lantern.onWake(() => void listen());
window.lantern.onStateChanged((next) => setState(next));

let spoken = "";
window.lantern.onAssistantDelta(({ text, done }) => {
  if (done) {
    if (spoken.trim()) void window.lantern.speak(spoken);
    spoken = "";
    // Leave the last line up briefly so a short answer can be read.
    setTimeout(() => setCaption(""), 2500);
    return;
  }
  if (text === "") {
    spoken = "";
    setCaption("");
    return;
  }
  spoken += text;
  // Only the tail fits under a 260px orb.
  setCaption(spoken.slice(-140));
});

window.lantern.onError((message) => {
  setState("error");
  setCaption(message.slice(0, 160));
  setTimeout(() => setState("idle"), 5000);
});

window.addEventListener("resize", () => orb.resize());

setState("idle");
