/**
 * Microphone capture, level metering and end-of-speech detection.
 *
 * Runs in the renderer because that is where `getUserMedia` lives. It produces
 * two things: a smoothed 0..1 level that drives the orb every frame, and the
 * raw Float32 PCM of an utterance once the speaker stops, which goes to the
 * main process for transcription.
 *
 * The voice-activity detection is intentionally simple — an RMS threshold with
 * a hangover timer — because a personal push-to-talk assistant does not need to
 * survive a noisy cafe, and an aggressive neural VAD that clips the first
 * syllable is worse than none.
 */

export interface VoiceCaptureOptions {
  /** RMS above this counts as speech. Raise it in a loud room. */
  threshold?: number;
  /** Silence this long after speech ends the utterance, in milliseconds. */
  silenceMs?: number;
  /** Give up after this long regardless, in milliseconds. */
  maxUtteranceMs?: number;
  /** Called every analysis frame with the smoothed level, 0..1. */
  onLevel?: (level: number) => void;
  /** Called once when speech is first detected. */
  onSpeechStart?: () => void;
}

export interface Utterance {
  samples: Float32Array;
  sampleRate: number;
  /** True when the recording stopped because the user stopped talking. */
  endedNaturally: boolean;
}

const DEFAULTS = {
  threshold: 0.012,
  silenceMs: 900,
  maxUtteranceMs: 30_000,
};

/** Root mean square of a frame — a decent stand-in for perceived loudness. */
export function rms(frame: Float32Array): number {
  if (frame.length === 0) return 0;
  let sum = 0;
  for (const sample of frame) sum += sample * sample;
  return Math.sqrt(sum / frame.length);
}

/**
 * Map RMS onto something that looks right on a visualiser.
 *
 * Loudness is perceived roughly logarithmically, so a linear RMS spends most
 * of its range near zero and the orb barely moves for normal speech. A cube
 * root opens up the quiet end.
 */
export function levelFromRms(value: number): number {
  return Math.min(1, Math.cbrt(value * 12));
}

export class VoiceCapture {
  private context: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private chunks: Float32Array[] = [];
  private smoothedLevel = 0;
  private speaking = false;
  private lastVoiceAt = 0;
  private startedAt = 0;
  private settle: ((utterance: Utterance) => void) | null = null;
  private active = false;

  constructor(private readonly options: VoiceCaptureOptions = {}) {}

  get isActive(): boolean {
    return this.active;
  }

  /**
   * Start recording and resolve once the utterance ends — either because the
   * speaker stopped, the cap was hit, or `stop()` was called.
   */
  async record(): Promise<Utterance> {
    if (this.active) throw new Error("Already recording");

    const settings = { ...DEFAULTS, ...this.options };
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
    });

    this.context = new AudioContext();
    const source = this.context.createMediaStreamSource(this.stream);

    // ScriptProcessorNode is deprecated in favour of AudioWorklet, but a
    // worklet needs a separately-bundled module file, and this node is
    // supported everywhere Electron runs. The tradeoff is a main-thread
    // callback every ~93ms, which is not enough work to drop a frame.
    this.processor = this.context.createScriptProcessor(4096, 1, 1);

    this.chunks = [];
    this.speaking = false;
    this.smoothedLevel = 0;
    this.startedAt = performance.now();
    this.lastVoiceAt = this.startedAt;
    this.active = true;

    const finished = new Promise<Utterance>((resolve) => {
      this.settle = resolve;
    });

    this.processor.onaudioprocess = (event) => {
      if (!this.active) return;
      const input = event.inputBuffer.getChannelData(0);
      // The buffer is reused by the audio system; copy before keeping it.
      this.chunks.push(new Float32Array(input));

      const loudness = rms(input);
      const level = levelFromRms(loudness);
      // Fast attack, slow release: the orb jumps on a word and settles after.
      const rate = level > this.smoothedLevel ? 0.5 : 0.12;
      this.smoothedLevel += (level - this.smoothedLevel) * rate;
      this.options.onLevel?.(this.smoothedLevel);

      const now = performance.now();
      if (loudness > settings.threshold) {
        if (!this.speaking) {
          this.speaking = true;
          this.options.onSpeechStart?.();
        }
        this.lastVoiceAt = now;
      }

      const silentLongEnough = this.speaking && now - this.lastVoiceAt > settings.silenceMs;
      const tooLong = now - this.startedAt > settings.maxUtteranceMs;
      if (silentLongEnough || tooLong) this.finish(true);
    };

    source.connect(this.processor);
    // A ScriptProcessorNode only runs while connected to a destination. Routing
    // it through a silent gain keeps the callback alive without echoing the
    // microphone back out of the speakers.
    const mute = this.context.createGain();
    mute.gain.value = 0;
    this.processor.connect(mute);
    mute.connect(this.context.destination);

    return finished;
  }

  /** Stop early, keeping whatever was captured. */
  stop(): void {
    if (this.active) this.finish(false);
  }

  private finish(endedNaturally: boolean): void {
    if (!this.active) return;
    this.active = false;

    const sampleRate = this.context?.sampleRate ?? 48_000;
    const total = this.chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const samples = new Float32Array(total);
    let offset = 0;
    for (const chunk of this.chunks) {
      samples.set(chunk, offset);
      offset += chunk.length;
    }

    this.teardown();
    this.options.onLevel?.(0);

    const settle = this.settle;
    this.settle = null;
    settle?.({ samples, sampleRate, endedNaturally });
  }

  private teardown(): void {
    if (this.processor) {
      this.processor.onaudioprocess = null;
      this.processor.disconnect();
      this.processor = null;
    }
    for (const track of this.stream?.getTracks() ?? []) track.stop();
    this.stream = null;
    void this.context?.close().catch(() => undefined);
    this.context = null;
    this.chunks = [];
  }
}
