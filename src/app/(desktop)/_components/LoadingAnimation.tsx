"use client";

import { useRef } from "react";
import CRTScreen from "./crt";
import { useCRTCanvas } from "./crt/crtCanvas";
import {
  ACCENT,
  ACCENT_RGBA_07,
  ACCENT_RGBA_40,
  BG,
  CRT_BLOOM_RADIUS_FACTOR,
  FONT,
  glitchText,
  getGlitchPhase,
} from "../_constants/crt";

// Keep the loading animation timing and layout values in one place.
const DOT_CYCLE_MAX = 4;
const DOT_UPDATE_MS = 400;
const TITLE_X_FACTOR = 0.045;
const TITLE_Y_FACTOR = 0.1;
const TITLE_FONT_FACTOR = 0.042;
const GLOW_BLUR = 14;

/**
 * Paints one frame of the loading screen onto the 2D canvas.
 *
 * The CRT wrapper handles the shader effect; this function only draws the
 * actual loading text and background glow.
 */
function drawLoadingFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  dots: number,
  glitchPhase: 0 | 1 | 2,
) {
  // Solid CRT background.
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);

  // Soft center glow, like a real monitor phosphor bloom.
  const bloom = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * CRT_BLOOM_RADIUS_FACTOR);
  bloom.addColorStop(0, ACCENT_RGBA_07);
  bloom.addColorStop(1, "transparent");
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, w, h);

  const loadingText = `Loading${".".repeat(dots)}`;

  // Text is intentionally large and glowy to match the rest of the CRT UI.
  ctx.font = `${Math.round(h * TITLE_FONT_FACTOR)}px ${FONT}`;
  ctx.shadowBlur = GLOW_BLUR;
  ctx.shadowColor = ACCENT_RGBA_40;
  glitchText(
    ctx,
    loadingText,
    Math.round(w * TITLE_X_FACTOR),
    Math.round(h * TITLE_Y_FACTOR),
    ACCENT,
    glitchPhase,
  );
  ctx.shadowBlur = 0;
}

export default function LoadingScreen({
  radTopPct,
  radBotPct,
  overscanClass,
}: {
  radTopPct?: number;
  radBotPct?: number;
  overscanClass?: string;
} = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Mutable animation state that should not trigger React re-renders.
  const animRef = useRef({ dots: 0, lastDotTime: 0 });

  useCRTCanvas(canvasRef, (ctx, w, h, t) => {
    const ms = t * 1000;
    if (ms - animRef.current.lastDotTime > DOT_UPDATE_MS) {
      animRef.current.dots = (animRef.current.dots + 1) % DOT_CYCLE_MAX;
      animRef.current.lastDotTime = ms;
    }
    drawLoadingFrame(ctx, w, h, animRef.current.dots, getGlitchPhase(t));
  }, [], radTopPct, radBotPct);

  return (
    <CRTScreen overscanClass={overscanClass}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </CRTScreen>
  );
}
