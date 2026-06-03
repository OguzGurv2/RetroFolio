// ─── Shared CRT + theme tokens ───────────────────────────────────────────────
//
//  To customise the visual theme, change these three values:
//
//    ACCENT  — the glow / highlight colour used everywhere (default: green)
//    BG      — the background colour of the CRT screen
//    FONT    — the typeface for all canvas-drawn text
//              (must match the font loaded in layout.tsx via next/font)
//
//  All ACCENT_RGBA_* constants below are pre-computed alpha variants of
//  ACCENT — if you change ACCENT you should regenerate them to match.
//  Use: rgba(r,g,b,alpha) where r,g,b are the decimal values of your hex colour.
//
export const ACCENT   = "#00ff85";
export const BG       = "#0c0c0c";
export const FONT     = "VT323, monospace";

export const ACCENT_RGBA_07 = "rgba(0,255,133,0.07)";
export const ACCENT_RGBA_10 = "rgba(0,255,133,0.1)";
export const ACCENT_RGBA_12 = "rgba(0,255,133,0.12)";
export const ACCENT_RGBA_20 = "rgba(0,255,133,0.2)";
export const ACCENT_RGBA_25 = "rgba(0,255,133,0.25)";
export const ACCENT_RGBA_30 = "rgba(0,255,133,0.3)";
export const ACCENT_RGBA_40 = "rgba(0,255,133,0.4)";
export const ACCENT_RGBA_50 = "rgba(0,255,133,0.5)";
export const ACCENT_RGBA_60 = "rgba(0,255,133,0.6)";
export const ACCENT_RGBA_70 = "rgba(0,255,133,0.7)";
export const ACCENT_RGBA_80 = "rgba(0,255,133,0.8)";

export const CRT_BLOOM_RADIUS_FACTOR = 0.55;
export const CRT_FLICKER_AMPLITUDE   = 0.018;
export const CRT_FLICKER_FREQUENCY   = 97.3;

/** Must stay in sync with the u_barrel uniform default in CRTScreen/material.ts */
export const BARREL_K = 0.08;

/** Duration of one glitch-idle cycle in seconds – mirrors text-glitch-idle 8s */
export const GLITCH_CYCLE = 8;

export type GlitchMode       = "idle" | "in";
export type IdleGlitchPhase  = 0 | 1 | 2;
export type IntroGlitchPhase = 0 | 1 | 2 | 3 | 4 | 5;

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

function getFontPx(ctx: CanvasRenderingContext2D): number {
  return parseInt(ctx.font.match(/(\d+)px/)?.[1] ?? "18", 10);
}

export function getGlitchInPhase(progress: number): IntroGlitchPhase {
  const p = clamp01(progress) * 100;
  if (p >= 4  && p < 5)  return 1;
  if (p >= 14 && p < 15) return 2;
  if (p >= 40 && p < 41) return 3;
  if (p >= 70 && p < 71) return 4;
  if (p >= 71 && p < 72) return 5;
  return 0;
}

export function getGlitchIdlePhase(t: number): IdleGlitchPhase {
  const cp = (t % GLITCH_CYCLE) / GLITCH_CYCLE;
  if (cp >= 0.88 && cp < 0.89) return 1;
  if (cp >= 0.89 && cp < 0.91) return 2;
  return 0;
}

/**
 * Alias for getGlitchIdlePhase kept at call sites for semantic clarity —
 * "what phase is the glitch *in right now*" vs the more specific idle variant.
 */
export function getGlitchPhase(t: number): 0 | 1 | 2 {
  return getGlitchIdlePhase(t);
}

export function glitchText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  phase: 0 | 1 | 2,
): void {
  if (phase === 0) { ctx.fillStyle = color; ctx.fillText(text, x, y); return; }
  ctx.save();
  if (phase === 1) {
    const sz = getFontPx(ctx);
    const emTop = y - sz * 0.85;
    ctx.beginPath();
    ctx.rect(-9999, emTop + sz * 0.40, 99999, sz * 0.12);
    ctx.clip();
    ctx.transform(1, 0, Math.tan(-1.5 * Math.PI / 180), 1, 0, 0);
    ctx.fillStyle = "rgba(255,0,80,0.5)";  ctx.fillText(text, x - 1, y);
    ctx.fillStyle = "rgba(0,200,255,0.5)"; ctx.fillText(text, x + 1, y);
    ctx.fillStyle = color;                  ctx.fillText(text, x, y);
  } else {
    ctx.transform(1, 0, Math.tan(0.75 * Math.PI / 180), 1, 0, 0);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }
  ctx.restore();
}

export function glitchTextIn(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  phase: IntroGlitchPhase,
): void {
  if (phase === 0) { ctx.fillStyle = color; ctx.fillText(text, x, y); return; }
  const sz = getFontPx(ctx);
  const emTop = y - sz * 0.85;
  ctx.save();
  if (phase === 1) {
    ctx.beginPath(); ctx.rect(-9999, emTop + sz * 0.20, 99999, sz * 0.15); ctx.clip();
    ctx.transform(1, 0, Math.tan(-12 * Math.PI / 180), 1, 6, 0);
    ctx.fillStyle = "rgba(255,0,80,0.7)";  ctx.fillText(text, x - 4, y);
    ctx.fillStyle = "rgba(0,200,255,0.7)"; ctx.fillText(text, x + 4, y);
    ctx.fillStyle = color;                  ctx.fillText(text, x, y);
  } else if (phase === 2) {
    ctx.beginPath(); ctx.rect(-9999, emTop + sz * 0.55, 99999, sz * 0.10); ctx.clip();
    ctx.transform(1, 0, Math.tan(8 * Math.PI / 180), 1, -4, 0);
    ctx.fillStyle = "rgba(255,0,80,0.6)";  ctx.fillText(text, x + 3, y);
    ctx.fillStyle = "rgba(0,200,255,0.6)"; ctx.fillText(text, x - 3, y);
    ctx.fillStyle = color;                  ctx.fillText(text, x, y);
  } else if (phase === 3) {
    const prevAlpha = ctx.globalAlpha; const prevFilter = ctx.filter;
    ctx.globalAlpha = 0.2; ctx.filter = "brightness(3) blur(1px)";
    ctx.fillStyle = color; ctx.fillText(text, x, y);
    ctx.filter = prevFilter; ctx.globalAlpha = prevAlpha;
  } else if (phase === 4) {
    ctx.beginPath(); ctx.rect(-9999, emTop + sz * 0.10, 99999, sz * 0.12); ctx.clip();
    ctx.transform(1, 0, Math.tan(16 * Math.PI / 180), 1, 8, 0);
    ctx.fillStyle = "rgba(255,0,80,0.8)";  ctx.fillText(text, x - 6, y);
    ctx.fillStyle = "rgba(0,200,255,0.8)"; ctx.fillText(text, x + 6, y);
    ctx.fillStyle = color;                  ctx.fillText(text, x, y);
  } else {
    ctx.beginPath(); ctx.rect(-9999, emTop + sz * 0.70, 99999, sz * 0.15); ctx.clip();
    ctx.transform(1, 0, Math.tan(-10 * Math.PI / 180), 1, -5, 0);
    ctx.fillStyle = color; ctx.fillText(text, x, y);
  }
  ctx.restore();
}

export function drawGlitchText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  options: { mode: GlitchMode; t?: number; progress?: number },
): void {
  if (options.mode === "in") {
    glitchTextIn(ctx, text, x, y, color, getGlitchInPhase(options.progress ?? 1));
    return;
  }
  glitchText(ctx, text, x, y, color, getGlitchIdlePhase(options.t ?? 0));
}

// ─── Desktop-specific constants ──────────────────────────────────────────────
// Window / taskbar layout metrics
export const DESKTOP_TASKBAR_HEIGHT   = 34;
export const DESKTOP_TITLEBAR_HEIGHT  = 26;
export const DESKTOP_LINE_HEIGHT      = 26;
export const DESKTOP_WINDOW_PADDING   = 14;
export const DESKTOP_WINDOW_MIN_WIDTH = 320;

// Window chrome color tokens
export const DESKTOP_ACCENT_DIM    = ACCENT_RGBA_40;
export const DESKTOP_ACCENT_BORDER = ACCENT_RGBA_30;
export const DESKTOP_WINDOW_BG     = BG;
export const DESKTOP_TITLEBAR_BG   = ACCENT_RGBA_10;
export const DESKTOP_WINDOW_BORDER = ACCENT_RGBA_50;

// 2D canvas mask drawing — these rounded-rect radii are used when the
// desktop canvas draws its own overlay mask (larger than the shader radius).
export const DESKTOP_MASK_RAD_TOP_PCT = 0.06;
export const DESKTOP_MASK_RAD_BOT_PCT = 0.04;

// WebGL CRT shader corner radius factors — passed to useCRTCanvas / CRTScreen.
// Smaller than the canvas mask so the hard shader clip aligns inside the glow.
export const DESKTOP_CRT_RAD_TOP_PCT = 0.03;
export const DESKTOP_CRT_RAD_BOT_PCT = 0.02;

// Overscan bleed for the landscape CRT wrapper — clips barrel-distortion edges.
export const DESKTOP_OVERSCAN = "absolute -left-[4px] -right-[4px] -top-[2px] -bottom-[2px]";
