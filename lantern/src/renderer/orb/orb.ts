/**
 * The orb renderer.
 *
 * Deliberately free of any Electron or IPC dependency: it takes a canvas, a
 * state and an audio level, and draws. That keeps the visual centrepiece
 * testable in a plain browser, which is the only way to actually look at it
 * during development.
 *
 * WebGL2 with no third-party library, because the app has to work with the
 * network switched off and a CDN is not available to it.
 */

import type { AgentState } from "../../shared/types";
import {
  HALO_FRAGMENT_SHADER,
  HALO_VERTEX_SHADER,
  ORB_FRAGMENT_SHADER,
  ORB_VERTEX_SHADER,
} from "./shaders";

export interface Palette {
  /** Bright centre colour, linear 0..1 RGB. */
  core: [number, number, number];
  /** Cooler colour for particles further from the camera. */
  edge: [number, number, number];
  /** How much the surface churns, 0..1. */
  energy: number;
  /** Rotation speed in radians per second. */
  spin: number;
}

/**
 * One palette per state. The colours are the warm-lamp family the app is named
 * for: amber and plum at rest, cooler and brighter when it is listening to you,
 * violet while it thinks, red only when something is actually wrong.
 */
export const PALETTES: Record<AgentState, Palette> = {
  idle: {
    core: [1.0, 0.72, 0.38],
    edge: [0.55, 0.18, 0.42],
    energy: 0.16,
    spin: 0.1,
  },
  listening: {
    core: [0.72, 0.94, 1.0],
    edge: [0.25, 0.42, 0.85],
    energy: 0.62,
    spin: 0.26,
  },
  thinking: {
    core: [0.82, 0.62, 1.0],
    edge: [0.35, 0.16, 0.62],
    energy: 0.85,
    spin: 0.55,
  },
  speaking: {
    core: [1.0, 0.58, 0.24],
    edge: [0.72, 0.16, 0.36],
    energy: 0.5,
    spin: 0.2,
  },
  working: {
    core: [1.0, 0.85, 0.42],
    edge: [0.58, 0.32, 0.1],
    energy: 0.7,
    spin: 0.42,
  },
  error: {
    core: [1.0, 0.36, 0.36],
    edge: [0.45, 0.06, 0.12],
    energy: 0.3,
    spin: 0.08,
  },
};

const PARTICLE_COUNT = 22_000;

export interface OrbOptions {
  particleCount?: number;
  /** Radius of the sphere in world units. */
  radius?: number;
}

export class Orb {
  private gl: WebGL2RenderingContext;
  private particleProgram: WebGLProgram;
  private haloProgram: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private particleCount: number;
  private radius: number;

  private uniforms: {
    particle: Record<string, WebGLUniformLocation | null>;
    halo: Record<string, WebGLUniformLocation | null>;
  };

  private state: AgentState = "idle";
  /**
   * The live palette, eased toward the target so state changes are not abrupt.
   *
   * Deep-copied on purpose: a spread would share the `core` and `edge` arrays
   * with the PALETTES constant, and easing would then mutate the definitions
   * themselves — every orb in the process would drift to the same colour.
   */
  private current: Palette = clonePalette(PALETTES.idle);
  private rotation = 0;
  private level = 0;
  private opacity = 1;
  private startTime = performance.now();
  private frame = 0;
  private running = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    options: OrbOptions = {},
  ) {
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    });
    if (!gl) throw new Error("WebGL2 is not available in this context");
    this.gl = gl;

    this.particleCount = options.particleCount ?? PARTICLE_COUNT;
    this.radius = options.radius ?? 1;

    this.particleProgram = createProgram(gl, ORB_VERTEX_SHADER, ORB_FRAGMENT_SHADER);
    this.haloProgram = createProgram(gl, HALO_VERTEX_SHADER, HALO_FRAGMENT_SHADER);

    this.uniforms = {
      particle: collectUniforms(gl, this.particleProgram, [
        "uTime",
        "uLevel",
        "uEnergy",
        "uRadius",
        "uPixelRatio",
        "uProjection",
        "uView",
        "uRotation",
        "uColorCore",
        "uColorEdge",
        "uOpacity",
      ]),
      halo: collectUniforms(gl, this.haloProgram, ["uColorCore", "uLevel", "uOpacity"]),
    };

    this.vao = this.buildParticles();
    this.resize();
  }

  /** Distribute particles evenly over a sphere and upload them once. */
  private buildParticles(): WebGLVertexArrayObject {
    const gl = this.gl;
    const positions = new Float32Array(this.particleCount * 3);
    const seeds = new Float32Array(this.particleCount);

    // Fibonacci sphere: even coverage with no clustering at the poles, which
    // is what a naive random spherical sampling gives you.
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < this.particleCount; i += 1) {
      const y = 1 - (i / Math.max(1, this.particleCount - 1)) * 2;
      const ringRadius = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;

      positions[i * 3] = Math.cos(theta) * ringRadius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * ringRadius;
      // Deterministic per-particle jitter; a real RNG would flicker on reload.
      seeds[i] = fract(Math.sin(i * 12.9898) * 43758.5453);
    }

    const vao = gl.createVertexArray();
    if (!vao) throw new Error("Could not create a vertex array object");
    gl.bindVertexArray(vao);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const positionLocation = gl.getAttribLocation(this.particleProgram, "aBasePosition");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

    const seedBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, seedBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
    const seedLocation = gl.getAttribLocation(this.particleProgram, "aSeed");
    gl.enableVertexAttribArray(seedLocation);
    gl.vertexAttribPointer(seedLocation, 1, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
    return vao;
  }

  setState(state: AgentState): void {
    this.state = state;
  }

  /** Feed the smoothed microphone amplitude, 0..1. */
  setLevel(level: number): void {
    this.level = Math.max(0, Math.min(1, level));
  }

  /** Fade the whole orb, for hiding it without destroying the context. */
  setOpacity(opacity: number): void {
    this.opacity = Math.max(0, Math.min(1, opacity));
  }

  resize(): void {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(this.canvas.clientWidth * ratio));
    const height = Math.max(1, Math.floor(this.canvas.clientHeight * ratio));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.gl.viewport(0, 0, width, height);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      this.render();
      this.frame = requestAnimationFrame(loop);
    };
    this.frame = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }

  /** Draw one frame. Public so tests and previews can step it deterministically. */
  render(now = performance.now()): void {
    const gl = this.gl;
    const time = (now - this.startTime) / 1000;

    this.easeTowardState();
    this.rotation += this.current.spin * 0.016;

    this.resize();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.enable(gl.BLEND);
    // Additive: overlapping particles brighten instead of occluding, which is
    // what makes a dense centre look lit from inside.
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.disable(gl.DEPTH_TEST);

    this.drawHalo();
    this.drawParticles(time);
  }

  private drawHalo(): void {
    const gl = this.gl;
    gl.useProgram(this.haloProgram);
    gl.uniform3fv(this.uniforms.halo.uColorCore ?? null, this.current.core);
    gl.uniform1f(this.uniforms.halo.uLevel ?? null, this.level);
    gl.uniform1f(this.uniforms.halo.uOpacity ?? null, this.opacity);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private drawParticles(time: number): void {
    const gl = this.gl;
    const aspect = this.canvas.width / Math.max(1, this.canvas.height);

    gl.useProgram(this.particleProgram);
    gl.bindVertexArray(this.vao);

    const u = this.uniforms.particle;
    gl.uniform1f(u.uTime ?? null, time);
    gl.uniform1f(u.uLevel ?? null, this.level);
    gl.uniform1f(u.uEnergy ?? null, this.current.energy);
    gl.uniform1f(u.uRadius ?? null, this.radius);
    gl.uniform1f(u.uPixelRatio ?? null, Math.min(window.devicePixelRatio || 1, 2));
    gl.uniform1f(u.uRotation ?? null, this.rotation);
    gl.uniform1f(u.uOpacity ?? null, this.opacity);
    gl.uniform3fv(u.uColorCore ?? null, this.current.core);
    gl.uniform3fv(u.uColorEdge ?? null, this.current.edge);
    gl.uniformMatrix4fv(u.uProjection ?? null, false, perspective(Math.PI / 4, aspect, 0.1, 20));
    gl.uniformMatrix4fv(u.uView ?? null, false, lookAtOrigin(3.05));

    gl.drawArrays(gl.POINTS, 0, this.particleCount);
    gl.bindVertexArray(null);
  }

  /**
   * Ease the live palette toward the target.
   *
   * Snapping between states makes the orb feel like a status light; easing over
   * roughly a third of a second makes it feel like it is reacting.
   */
  private easeTowardState(): void {
    const target = PALETTES[this.state];
    const rate = 0.08;
    for (let i = 0; i < 3; i += 1) {
      this.current.core[i]! += (target.core[i]! - this.current.core[i]!) * rate;
      this.current.edge[i]! += (target.edge[i]! - this.current.edge[i]!) * rate;
    }
    this.current.energy += (target.energy - this.current.energy) * rate;
    this.current.spin += (target.spin - this.current.spin) * rate;
  }

  dispose(): void {
    this.stop();
    const gl = this.gl;
    gl.deleteProgram(this.particleProgram);
    gl.deleteProgram(this.haloProgram);
    gl.deleteVertexArray(this.vao);
  }
}

/** A palette with its own colour arrays, safe to mutate while easing. */
function clonePalette(palette: Palette): Palette {
  return {
    core: [...palette.core],
    edge: [...palette.edge],
    energy: palette.energy,
    spin: palette.spin,
  };
}

function fract(value: number): number {
  return value - Math.floor(value);
}

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Could not create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader failed to compile: ${log}`);
  }
  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error("Could not create program");

  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);

  // Shaders are reference-counted by the program; detaching lets them go.
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program failed to link: ${log}`);
  }
  return program;
}

function collectUniforms(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  names: string[],
): Record<string, WebGLUniformLocation | null> {
  const out: Record<string, WebGLUniformLocation | null> = {};
  for (const name of names) out[name] = gl.getUniformLocation(program, name);
  return out;
}

/** Column-major perspective matrix, the layout WebGL expects. */
export function perspective(fovY: number, aspect: number, near: number, far: number): Float32Array {
  const f = 1 / Math.tan(fovY / 2);
  const rangeInverse = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * rangeInverse, -1,
    0, 0, near * far * rangeInverse * 2, 0,
  ]);
}

/** A camera on +Z looking at the origin, with +Y up. */
export function lookAtOrigin(distance: number): Float32Array {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, -distance, 1,
  ]);
}
