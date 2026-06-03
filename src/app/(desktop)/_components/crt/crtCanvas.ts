"use client";

/**
 * useCRTCanvas
 *
 * What this hook does:
 * 1) Creates a WebGL renderer on a visible canvas
 * 2) Creates an offscreen 2D canvas that your screen code draws into
 * 3) Uploads that 2D canvas as a texture every frame
 * 4) Runs a CRT shader pass (barrel, scanlines, vignette, etc.)
 *
 * Caller contract:
 * - Pass a `draw(...)` function that renders a full frame into `ctx2d`
 * - The hook handles RAF timing, texture upload, resize sync, and cleanup
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createRenderer } from "./renderer";
import { createCRTMaterial } from "./material";

const MS_TO_SECONDS = 0.001;
// Fallback radius factors match the desktop landscape tuning.
const DEFAULT_RAD_TOP_PCT = 0.03;
const DEFAULT_RAD_BOT_PCT = 0.02;

export interface CRTCanvasHandle {
  // 2D context the caller draws UI into every frame.
  ctx2d: CanvasRenderingContext2D;

  // Marks texture dirty for optional extra updates outside RAF.
  markDirty: () => void;
}

export function useCRTCanvas(
  glCanvasRef: React.RefObject<HTMLCanvasElement | null>,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void,
  deps: unknown[],
  radTopPct = DEFAULT_RAD_TOP_PCT,
  radBotPct = DEFAULT_RAD_BOT_PCT,
) {
  // Exposed handle to consumers of the hook.
  const handleRef = useRef<CRTCanvasHandle | null>(null);

  // Keep latest draw callback without tearing down the full GL stack.
  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
  });

  useEffect(() => {
    const glCanvas = glCanvasRef.current;
    if (!glCanvas) return;

    // ---------------------------------------------------------------------
    // 1) Core Three.js objects
    // ---------------------------------------------------------------------
    const renderer = createRenderer(glCanvas);
    renderer.setSize(glCanvas.clientWidth, glCanvas.clientHeight, false);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // ---------------------------------------------------------------------
    // 2) Offscreen 2D canvas (source texture)
    // ---------------------------------------------------------------------
    // Offscreen size must be physical pixels so shader u_res math stays exact.
    const dpr = renderer.getPixelRatio();
    const off = document.createElement("canvas");
    off.width = Math.round(glCanvas.clientWidth * dpr);
    off.height = Math.round(glCanvas.clientHeight * dpr);
    const ctx2d = off.getContext("2d")!;

    // ---------------------------------------------------------------------
    // 3) Texture + shader material + full-screen quad
    // ---------------------------------------------------------------------
    const tex = new THREE.CanvasTexture(off);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;

    // `createCRTMaterial` starts with u_tex = null by design.
    // We wire it here so ownership stays in this hook.
    const mat = createCRTMaterial();
    mat.uniforms.u_tex.value = tex;

    // Correct initial resolution/radius uniforms using real drawing-buffer size.
    const initW = off.width;
    const initH = off.height;
    mat.uniforms.u_res.value.set(initW, initH);
    mat.uniforms.u_radTop.value = initW * radTopPct;
    mat.uniforms.u_radBot.value = initW * radBotPct;

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    scene.add(mesh);

    handleRef.current = {
      ctx2d,
      markDirty: () => {
        tex.needsUpdate = true;
      },
    };

    // ---------------------------------------------------------------------
    // 4) RAF render loop
    // ---------------------------------------------------------------------
    let raf = 0;
    let cancelled = false;

    function renderFrame(timeMs: number) {
      if (cancelled) return;

      raf = requestAnimationFrame(renderFrame);

      // These are physical pixels, matching shader `u_res` space exactly.
      const w = renderer.domElement.width;
      const h = renderer.domElement.height;

      // Ask caller to draw into offscreen 2D canvas.
      ctx2d.clearRect(0, 0, w, h);
      drawRef.current(ctx2d, w, h, timeMs * MS_TO_SECONDS);

      // Upload fresh 2D pixels to GPU texture.
      tex.needsUpdate = true;

      // Keep shader uniforms in sync with frame timing and resolution.
      mat.uniforms.u_time.value = timeMs * MS_TO_SECONDS;
      mat.uniforms.u_res.value.set(w, h);

      renderer.render(scene, camera);
    }

    raf = requestAnimationFrame(renderFrame);

    // ---------------------------------------------------------------------
    // 5) Resize handling
    // ---------------------------------------------------------------------
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const cw = Math.round(entry.contentRect.width);
      const ch = Math.round(entry.contentRect.height);
      if (cw === 0 || ch === 0) return;

      renderer.setSize(cw, ch, false);

      const curDpr = renderer.getPixelRatio();
      const pw = Math.round(cw * curDpr);
      const ph = Math.round(ch * curDpr);
      off.width = pw;
      off.height = ph;

      // Corner radii scale with physical width for stable visual shape.
      mat.uniforms.u_radTop.value = pw * radTopPct;
      mat.uniforms.u_radBot.value = pw * radBotPct;

      // u_res is updated every frame in the loop, no need to set here
    });
    ro.observe(glCanvas);

    // ---------------------------------------------------------------------
    // 6) Cleanup
    // ---------------------------------------------------------------------
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);

      ro.disconnect();

      tex.dispose();
      mat.dispose();
      mesh.geometry.dispose();
      renderer.dispose();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glCanvasRef, ...deps]);

  return handleRef;
}
