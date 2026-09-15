/**
 * A browser harness for the orb.
 *
 * The orb is the one part of Lantern that cannot be verified by a unit test:
 * either the shaders compile and it looks right, or they do not. This page
 * renders every agent state side by side so the whole palette can be checked
 * at once, in a real browser, with no Electron involved.
 *
 *   npm run orb:preview   # build, then serve tools/orb-preview/dist
 */

import { Orb } from "../../src/renderer/orb/orb";
import type { AgentState } from "../../src/shared/types";

const STATES: Array<{ state: AgentState; level: number }> = [
  { state: "idle", level: 0.0 },
  { state: "listening", level: 0.65 },
  { state: "thinking", level: 0.1 },
  { state: "speaking", level: 0.45 },
  { state: "working", level: 0.2 },
  { state: "error", level: 0.0 },
];

const orbs: Orb[] = [];

for (const { state, level } of STATES) {
  const figure = document.createElement("figure");
  const canvas = document.createElement("canvas");
  const caption = document.createElement("figcaption");
  caption.textContent = state;

  figure.append(canvas, caption);
  document.body.append(figure);

  // Fewer particles per orb than the real window, since six are on screen.
  const orb = new Orb(canvas, { particleCount: 9000 });
  orb.setState(state);
  orb.setLevel(level);
  orbs.push(orb);
}

/**
 * Step every orb by hand rather than starting its own rAF loop, so a
 * screenshot can be taken at a known, reproducible frame.
 */
function step(frames: number): void {
  for (let frame = 0; frame < frames; frame += 1) {
    // Fake a clock so the noise field has actually advanced by capture time.
    for (const orb of orbs) orb.render(performance.now() + frame * 16.7);
  }
}

// Ease the palettes in, then hold. The harness exposes this to Playwright.
(window as unknown as { renderOrbs: (frames: number) => void }).renderOrbs = step;
step(60);
(window as unknown as { orbsReady: boolean }).orbsReady = true;
