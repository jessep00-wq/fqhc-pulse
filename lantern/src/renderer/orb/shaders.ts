/**
 * GLSL for the orb.
 *
 * The orb is a shell of points on a sphere, displaced every frame by fractal
 * value noise and by the microphone level. Two things make it read as alive
 * rather than as a spinning ball of dots:
 *
 *   The displacement is sampled in the particle's *own* object space, so the
 *   surface churns while the whole body rotates. If the noise were sampled in
 *   world space the texture would swim across a static surface, which looks
 *   like a screensaver.
 *
 *   Particles are additively blended and sized by depth, so density at the
 *   centre produces the glow for free. There is no separate glow pass.
 *
 * Noise is a hand-rolled 3D value noise rather than simplex: it is cheaper,
 * it has no licence to carry, and at three octaves the difference is not
 * visible on a 260px orb.
 */

export const ORB_VERTEX_SHADER = /* glsl */ `#version 300 es
precision highp float;

in vec3 aBasePosition;   // unit-sphere position, fixed for the particle's life
in float aSeed;          // per-particle randomness, 0..1

uniform float uTime;
uniform float uLevel;        // smoothed microphone amplitude, 0..1
uniform float uEnergy;       // how animated this state is, 0..1
uniform float uRadius;
uniform float uPixelRatio;
uniform mat4 uProjection;
uniform mat4 uView;
uniform float uRotation;

out float vDepth;
out float vNoise;
out float vSeed;

// --- 3D value noise -------------------------------------------------------

float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float valueNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  // Quintic fade: continuous second derivative, so the surface has no creases.
  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

  return mix(
    mix(
      mix(hash(i + vec3(0.0, 0.0, 0.0)), hash(i + vec3(1.0, 0.0, 0.0)), u.x),
      mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), u.x),
      u.y),
    mix(
      mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), u.x),
      mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.1, 1.0)), u.x),
      u.y),
    u.z);
}

float fbm(vec3 p) {
  float total = 0.0;
  float amplitude = 0.5;
  for (int octave = 0; octave < 3; octave++) {
    total += valueNoise(p) * amplitude;
    p *= 2.02;          // a hair off 2.0 so octaves do not align into banding
    amplitude *= 0.5;
  }
  return total;
}

mat3 rotateY(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);
}

void main() {
  vec3 base = normalize(aBasePosition);

  // Churn sampled in object space so the surface moves under the rotation.
  float t = uTime * (0.16 + uEnergy * 0.3);
  float n = fbm(base * 2.1 + vec3(0.0, t, t * 0.6));
  float centered = n - 0.5;

  // Voice pushes the shell outward; idle keeps a slow breath so it never
  // looks frozen when nothing is happening.
  float breath = sin(uTime * 0.9 + aSeed * 6.2831) * 0.012;
  float voice = uLevel * (0.20 + aSeed * 0.16);
  float churn = centered * (0.16 + uEnergy * 0.26);

  float radius = uRadius * (1.0 + churn + voice + breath);
  vec3 displaced = rotateY(uRotation) * (base * radius);

  vec4 viewPosition = uView * vec4(displaced, 1.0);
  gl_Position = uProjection * viewPosition;

  float depth = -viewPosition.z;
  vDepth = depth;
  vNoise = n;
  vSeed = aSeed;

  // Perspective-correct sizing, with a floor so far particles stay visible as
  // dust rather than vanishing into sub-pixel nothing.
  float size = (4.2 + aSeed * 4.0 + uLevel * 5.5) * uPixelRatio;
  gl_PointSize = max(1.0, size * (2.6 / max(depth, 0.35)));
}
`;

export const ORB_FRAGMENT_SHADER = /* glsl */ `#version 300 es
precision highp float;

in float vDepth;
in float vNoise;
in float vSeed;

uniform vec3 uColorCore;
uniform vec3 uColorEdge;
uniform float uOpacity;

out vec4 outColor;

void main() {
  // gl_PointCoord is the unit square of the point sprite; carve a soft disc.
  vec2 offset = gl_PointCoord - vec2(0.5);
  float distance = length(offset);
  if (distance > 0.5) discard;

  // Squared falloff reads as a glowing mote; linear looks like a flat dot.
  float falloff = 1.0 - smoothstep(0.0, 0.5, distance);
  falloff *= falloff;

  // Nearer particles take the core colour, further ones the edge colour, so
  // the orb has depth without a second render pass.
  float depthMix = clamp((vDepth - 1.9) * 0.75, 0.0, 1.0);
  vec3 color = mix(uColorCore, uColorEdge, depthMix * 0.85 + vNoise * 0.15);

  // A few particles burn brighter, which keeps the surface from looking
  // uniformly sprayed.
  float sparkle = step(0.986, vSeed) * 0.5;

  // Additive blending accumulates: with tens of thousands of overlapping
  // points, a per-particle alpha anywhere near 1 clips the whole orb to white.
  // Keeping each contribution low is what leaves the colour visible.
  float alpha = falloff * uOpacity * (0.30 + vNoise * 0.28) * (1.0 - depthMix * 0.5);
  outColor = vec4(color * (1.0 + sparkle), alpha);
}
`;

/** A full-screen triangle, used to lay a soft halo behind the particles. */
export const HALO_VERTEX_SHADER = /* glsl */ `#version 300 es
precision highp float;
out vec2 vUv;
void main() {
  // Three vertices covering the viewport, no buffer needed.
  vec2 positions[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  vec2 p = positions[gl_VertexID];
  vUv = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}
`;

export const HALO_FRAGMENT_SHADER = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;

uniform vec3 uColorCore;
uniform float uLevel;
uniform float uOpacity;

out vec4 outColor;

void main() {
  vec2 centered = vUv - vec2(0.5);
  float distance = length(centered);

  // A projected hollow shell is densest at its rim and sparsest through the
  // middle, so without this the orb reads as a ring. The halo puts the light
  // back in the centre. It widens a little when the user speaks.
  float radius = 0.34 + uLevel * 0.07;
  float glow = 1.0 - smoothstep(0.0, radius, distance);
  glow = pow(glow, 2.2);

  outColor = vec4(uColorCore, glow * 0.45 * uOpacity);
}
`;
