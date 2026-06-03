/**
 * CRT post-process shader material used by the canvas-based screens.
 *
 * Goal for junior devs:
 * - This material takes a flat 2D texture (our offscreen canvas)
 * - Then makes it look like an old CRT monitor
 * - The fragment shader is organized in visual "passes" from top to bottom
 */
import * as THREE from "three";
import { BARREL_K } from "@/(desktop)/_constants/crt";

// Default tuning values. Keep these in one place so balancing the look is easy.
const DEFAULT_SCAN_OPACITY = 0.35;
const DEFAULT_VIGNETTE = 0.25;
const DEFAULT_CHROMA_OFFSET = 0.0018;
const DEFAULT_FLICKER = 0.018;
// Radius uniforms are always overridden by useCRTCanvas immediately after
// createCRTMaterial() returns, so 0 here is a safe placeholder.
const INITIAL_RADIUS = 0;

/**
 * Vertex shader:
 * - For a full-screen quad, we mostly forward UVs to the fragment shader.
 */
export const CRT_VERT = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/**
 * Fragment shader pipeline order:
 * 1) Barrel distortion + bounds mask
 * 2) Rounded outer mask in barrel space
 * 3) Chromatic aberration
 * 4) Scanlines
 * 5) Vignette
 * 6) Flicker
 * 7) Rim + border polish
 * 8) Final alpha cutout
 */
export const CRT_FRAG = /* glsl */ `
precision highp float;

uniform sampler2D u_tex;
uniform vec2  u_res;      // drawing-buffer size in physical pixels
uniform float u_time;
uniform float u_barrel;
uniform float u_scan;
uniform float u_vign;
uniform float u_chroma;
uniform float u_flicker;
uniform float u_radTop;   // top corner radius (px)
uniform float u_radBot;   // bottom corner radius (px)

varying vec2 vUv;

// Distort UV around screen center (0.5, 0.5)
vec2 barrel(vec2 uv) {
  vec2 c = uv - 0.5;
  float r2 = dot(c, c);
  return 0.5 + c * (1.0 + u_barrel * r2);
}

// Returns 1 when UV is inside [0..1], else 0.
float uvInBounds(vec2 uv) {
  vec2 bounds = step(vec2(0.0), uv) * step(uv, vec2(1.0));
  return bounds.x * bounds.y;
}

// Rounded-rectangle SDF in pixel space, centered in the frame.
// Negative = inside, positive = outside.
float rrSDF(vec2 p, vec2 size, float rTop, float rBot) {
  vec2 c = p - size * 0.5;
  float r = (c.y > 0.0) ? rTop : rBot;
  vec2 q = abs(c) - size * 0.5 + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 size = u_res;

  // 1) Barrel mapping in UV space
  vec2 uv = barrel(vUv);
  float inBounds = uvInBounds(uv);

  // 2) Rounded outer mask in barrel space (makes corners follow distortion)
  vec2 maskPx = uv * size;
  float oDist = rrSDF(maskPx, size, u_radTop, u_radBot);
  float aaW = max(fwidth(oDist), 1.25);
  float outerMask = 1.0 - smoothstep(-aaW, aaW, oDist);

  // 3) Chromatic aberration (sample R and B from slightly shifted barrel UVs)
  float ca = u_chroma;
  vec2 uvR = barrel(vUv + vec2( ca, 0.0));
  vec2 uvB = barrel(vUv + vec2(-ca, 0.0));

  float r = texture2D(u_tex, clamp(uvR, 0.0, 1.0)).r * uvInBounds(uvR);
  float g = texture2D(u_tex, clamp(uv,  0.0, 1.0)).g * inBounds;
  float b = texture2D(u_tex, clamp(uvB, 0.0, 1.0)).b * uvInBounds(uvB);
  vec3 col = vec3(r, g, b);

  // 4) Horizontal scanlines
  float scanY = mod(gl_FragCoord.y, 4.0);
  float scanLine = (scanY < 2.0) ? 1.0 : (1.0 - u_scan * 0.55);
  col *= scanLine;

  // 5) Radial vignette adjusted for aspect ratio
  vec2 vc = vUv - 0.5;
  vec2 vcAR = vc * vec2(u_res.x / u_res.y, 1.0);
  float vd = dot(vcAR, vcAR);
  col *= 1.0 - smoothstep(0.18, 0.72, vd) * u_vign;

  // 6) Subtle high-frequency brightness flicker
  col *= 1.0 - u_flicker * (0.5 + 0.5 * sin(u_time * 97.3));

  // 7) Edge polish: cool glass rim + thin border stripe
  float rimAlpha = (1.0 - outerMask) * (1.0 - smoothstep(0.0, 4.0, oDist));
  col = mix(col, vec3(0.9, 0.95, 1.0), rimAlpha * 0.18);

  float borderW = 1.0;
  float borderAA = max(max(aaW, fwidth(oDist)), 0.9);
  float borderOuter = 1.0 - smoothstep(-borderAA, borderAA, oDist);
  float borderInner = 1.0 - smoothstep(-borderAA, borderAA, oDist + borderW);
  float stripe = borderOuter - borderInner;

  vec3 borderCol = vec3(0.85, 0.92, 1.0);
  col = mix(col, borderCol, stripe * 0.55);
  col += borderCol * stripe * 0.20;

  // 8) Apply rounded mask to both RGB and alpha
  col *= outerMask;
  gl_FragColor = vec4(col, outerMask);
}
`;

/**
 * Creates the CRT material with safe defaults.
 *
 * Note:
 * - Initial width/height are just boot values.
 * - `useCRTCanvas` updates `u_res`, `u_radTop`, and `u_radBot` to real values.
 */
export function createCRTMaterial(): THREE.ShaderMaterial {
  const width = window.innerWidth;
  const height = window.innerHeight;

  return new THREE.ShaderMaterial({
    vertexShader: CRT_VERT,
    fragmentShader: CRT_FRAG,
    transparent: true,
    depthWrite: false,
    uniforms: {
      // Texture is set by caller to keep ownership/lifecycle explicit.
      u_tex: { value: null },
      u_res: { value: new THREE.Vector2(width, height) },

      // Time + effect strengths
      u_time: { value: 0 },
      u_barrel: { value: BARREL_K },
      u_scan: { value: DEFAULT_SCAN_OPACITY },
      u_vign: { value: DEFAULT_VIGNETTE },
      u_chroma: { value: DEFAULT_CHROMA_OFFSET },
      u_flicker: { value: DEFAULT_FLICKER },

      // Radius defaults (updated to exact values after canvas init/resize)
      u_radTop:  { value: INITIAL_RADIUS },
      u_radBot:  { value: INITIAL_RADIUS },
    },
  });
}