/**
 * Mobile UI token file — single place to tune all visual behaviour.
 * Changing values here propagates to BootAnimation and LoadingAnimation
 * without touching component code.
 */

// ─ Timing (ms) ───────────────────────────────────────────────────────────────
export const SPLASH_DURATION_MS = 2200;   // How long the splash screen stays up

// ─ Glow — set as CSS `--glow` custom property on .text-glitch-idle elements ─
// The keyframe uses var(--glow) for the resting text-shadow, so changing these
// changes the glow of each text level without touching any keyframe.
export const GLOW_HERO    = "0 0 28px rgba(0,255,133,0.55), 0 0 64px rgba(0,255,133,0.18)";
export const GLOW_VERSION = "0 0 8px rgba(0,255,133,0.25)";
export const GLOW_INIT    = "0 0 6px rgba(0,255,133,0.2)";
export const GLOW_BODY    = "0 0 8px rgba(0,255,133,0.35)";

// ─ Glitch stagger pools ───────────────────────────────────────────────────────
// Element i picks delay/duration by: i % pool.length
// Negative delays start elements mid-cycle → glitches feel un-synced across elements.
const GLITCH_DELAY_POOL: readonly number[]    = [0, -3.1, -7.8, -13.4, -5.2, -18.6, -10.9, -2.4];
const GLITCH_DURATION_POOL: readonly number[] = [8.0, 8.3, 7.7, 9.1, 8.6, 7.4, 9.4, 8.8];

/**
 * Returns inline style props that stagger the idle-glitch cycle for element `i`.
 * Optionally includes a `--glow` CSS custom property consumed by .text-glitch-idle.
 *
 * Usage:
 *   <p className="mob-text-hero text-glitch-idle"
 *      style={glitchIdleStyle(0, GLOW_HERO) as React.CSSProperties}>
 */
export function glitchIdleStyle(
  i: number,
  glow?: string,
): Record<string, string> {
  return {
    animationDelay:    `${GLITCH_DELAY_POOL[i % GLITCH_DELAY_POOL.length]}s`,
    animationDuration: `${GLITCH_DURATION_POOL[i % GLITCH_DURATION_POOL.length]}s`,
    ...(glow != null ? { "--glow": glow } : {}),
  };
}
