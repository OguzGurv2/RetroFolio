/**
 * Creates a fresh Three.js WebGL renderer for our CRT screen canvas.
 *
 * Why this helper exists:
 * - Keep renderer setup in one place
 * - Reuse the exact same defaults across all screen components
 * - Make behavior easy for junior devs to discover and tweak
 */
import * as THREE from "three";

// Cap DPR to avoid overworking the GPU on very high-density displays.
const MAX_PIXEL_RATIO = 2;

// Renderer defaults tuned for our CRT post-processing pipeline.
const RENDERER_OPTIONS: THREE.WebGLRendererParameters = {
  antialias: false, // CRT look is intentionally sharp/pixel-ish after post FX.
  alpha: true,      // Needed so rounded-corner shader alpha can show through.
};

export function createRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    ...RENDERER_OPTIONS,
  });

  const pixelRatio = Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO);
  renderer.setPixelRatio(pixelRatio);

  return renderer;
}
