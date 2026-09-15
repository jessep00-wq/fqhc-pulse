import { describe, it, expect } from "vitest";

import { encodeWav, parseWhisperOutput, resampleMono } from "./stt";
import { spokenForm } from "./tts";

describe("resampleMono", () => {
  it("returns the input untouched when the rate already matches", () => {
    const input = new Float32Array([0.1, 0.2, 0.3]);
    expect(resampleMono(input, 16_000, 16_000)).toBe(input);
  });

  it("downsamples 48kHz to 16kHz, keeping about a third of the samples", () => {
    const input = new Float32Array(4800);
    const output = resampleMono(input, 48_000, 16_000);
    expect(output.length).toBe(1600);
  });

  it("preserves a constant signal's amplitude", () => {
    const input = new Float32Array(300).fill(0.5);
    const output = resampleMono(input, 48_000, 16_000);
    for (const sample of output) expect(sample).toBeCloseTo(0.5, 5);
  });

  it("handles empty input", () => {
    expect(resampleMono(new Float32Array(0), 48_000).length).toBe(0);
  });
});

describe("encodeWav", () => {
  it("writes a RIFF/WAVE header describing 16-bit mono PCM", () => {
    const wav = encodeWav(new Float32Array([0, 0.5, -0.5]), 16_000);

    expect(wav.subarray(0, 4).toString("ascii")).toBe("RIFF");
    expect(wav.subarray(8, 12).toString("ascii")).toBe("WAVE");
    expect(wav.readUInt16LE(20)).toBe(1); // PCM
    expect(wav.readUInt16LE(22)).toBe(1); // mono
    expect(wav.readUInt32LE(24)).toBe(16_000);
    expect(wav.readUInt16LE(34)).toBe(16); // bits per sample
    expect(wav.readUInt32LE(40)).toBe(6); // 3 samples * 2 bytes
    expect(wav.length).toBe(44 + 6);
  });

  it("clips rather than wrapping when the signal exceeds full scale", () => {
    const wav = encodeWav(new Float32Array([2, -2]), 16_000);
    expect(wav.readInt16LE(44)).toBe(32767);
    expect(wav.readInt16LE(46)).toBe(-32767);
  });
});

describe("parseWhisperOutput", () => {
  it("keeps only the spoken text from timestamped lines", () => {
    const output = [
      "whisper_init_from_file_with_params_no_state: loading model",
      "",
      "[00:00:00.000 --> 00:00:02.400]   Remind me what we decided about pricing.",
      "[00:00:02.400 --> 00:00:04.000]   And add it to today's note.",
      "",
      "whisper_print_timings:    total time =  1234.00 ms",
    ].join("\n");

    expect(parseWhisperOutput(output)).toBe(
      "Remind me what we decided about pricing. And add it to today's note.",
    );
  });

  it("handles a build that prints the bare transcript", () => {
    expect(parseWhisperOutput("Just the words.\n")).toBe("Just the words.");
  });

  it("drops whisper's non-speech markers", () => {
    expect(parseWhisperOutput("[00:00:00.000 --> 00:00:01.000]  [BLANK_AUDIO]")).toBe("");
  });

  it("returns an empty string for empty output", () => {
    expect(parseWhisperOutput("")).toBe("");
  });
});

describe("spokenForm", () => {
  it("strips Markdown emphasis rather than reading the asterisks", () => {
    expect(spokenForm("This is **important** and _this_ too")).toBe(
      "This is important and this too",
    );
  });

  it("reads a link's text, not its URL", () => {
    expect(spokenForm("See [the docs](https://example.com/very/long)")).toBe("See the docs");
  });

  it("reads a wikilink's alias when it has one", () => {
    expect(spokenForm("See [[Note Name|the note]]")).toBe("See the note");
    expect(spokenForm("See [[Note Name]]")).toBe("See Note Name");
  });

  it("does not read a code block aloud", () => {
    expect(spokenForm("Try:\n```sh\nrm -rf /\n```")).toBe("Try: code block");
  });

  it("drops heading marks and list bullets", () => {
    expect(spokenForm("# Title\n\n- one\n- two")).toBe("Title one two");
  });

  it("returns an empty string for empty input", () => {
    expect(spokenForm("   ")).toBe("");
  });
});
