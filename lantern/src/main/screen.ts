/**
 * Reading the screen.
 *
 * Electron's `desktopCapturer` gives the whole display as a bitmap without a
 * native dependency. The orb window is hidden for the duration of the capture,
 * because a screenshot of the assistant looking at itself is both useless and
 * a little unsettling.
 *
 * Images are downscaled before they reach the model: a 5K display is ~15MB as
 * PNG and costs a great deal of context for no extra legibility. 1600px on the
 * long edge keeps error dialogs and code readable.
 */

import { desktopCapturer, screen, type BrowserWindow } from "electron";

const MAX_EDGE = 1600;

export interface ScreenCaptureDeps {
  /** Windows to hide during capture so Lantern's own UI is not in the shot. */
  hideDuring: () => BrowserWindow[];
}

/**
 * Capture the primary display as a PNG data URL, or null if nothing came back.
 */
export async function captureScreen(deps: ScreenCaptureDeps): Promise<string | null> {
  const hidden: BrowserWindow[] = [];

  for (const window of deps.hideDuring()) {
    if (!window.isDestroyed() && window.isVisible()) {
      window.hide();
      hidden.push(window);
    }
  }

  // One frame for the compositor to actually remove those windows.
  await new Promise((resolve) => setTimeout(resolve, 120));

  try {
    const display = screen.getPrimaryDisplay();
    const { width, height } = display.size;
    const scale = Math.min(1, MAX_EDGE / Math.max(width, height));

    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: {
        width: Math.round(width * scale),
        height: Math.round(height * scale),
      },
    });

    const source = sources[0];
    if (!source || source.thumbnail.isEmpty()) return null;
    return source.thumbnail.toDataURL();
  } catch {
    return null;
  } finally {
    for (const window of hidden) {
      if (!window.isDestroyed()) window.showInactive();
    }
  }
}
