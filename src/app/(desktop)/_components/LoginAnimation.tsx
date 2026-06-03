"use client";

import { useState, useEffect, useRef } from "react";
import CRTScreen from "./crt";
import { useCRTCanvas } from "./crt/crtCanvas";
import {
  ACCENT,
  ACCENT_RGBA_07,
  ACCENT_RGBA_30,
  ACCENT_RGBA_40,
  ACCENT_RGBA_60,
  ACCENT_RGBA_70,
  BG,
  CRT_BLOOM_RADIUS_FACTOR,
  FONT,
  glitchText,
  getGlitchPhase,
  getGlitchIdlePhase,
} from "@/(desktop)/_constants/crt";
import { OS_BUILD_ID, OS_VERSION } from "@/_constants/version";
import { OWNER } from "@/_config/owner";

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * CONFIGURATION
 * ═════════════════════════════════════════════════════════════════════════════
 * All timing, colors, and content constants defined here for easy tweaking.
 */

// ─ Timing (milliseconds) for each animation phase
const BOOT_LINE_DELAY_EMPTY = 80; // Shorter pause on blank lines
const BOOT_LINE_DELAY_FILLED = 130; // Longer pause on text lines
const TRANSITION_TO_TYPE_MS = 500; // Wait after boot completes before showing login
const PAUSE_BEFORE_TYPE_MS = 800; // Pause while showing empty login form
const TRANSITION_TO_AUTH_MS = 600; // Wait after typing completes
const TYPE_DELAY_MIN = 150; // Min milliseconds between typed characters
const TYPE_DELAY_RANDOM = 80; // Random jitter added to typing speed
const TYPE_CURSOR_PULSE_MS = 150; // Cursor visible briefly after each typed character
const AUTH_MESSAGE_DELAY = 340; // Milliseconds between auth status updates
const LOGIN_COMPLETE_DELAY = 700; // Pause before calling onLogin()

// ─ Content displayed during boot sequence
const SYSTEM_LINES = [
  `${OWNER.osName}  v${OS_VERSION}  [${OS_BUILD_ID}]`,
  `Copyright (C) ${OWNER.name}. All rights reserved.`,
  "",
  "Checking system integrity........  OK",
  "Loading user profiles..............  OK",
  "Initialising display adapter.......  OK",
  "",
];

// Only these boot rows run idle glitch; keep the rest stable for readability.
const BOOT_GLITCH_LINE_INDEXES = new Set([0, 3, 5]);

// ─ Credentials (hardcoded for demo, no real authentication)
const USERNAME = OWNER.loginUsername;
const PASSWORD = "••••••••";

// ─ Status messages shown during authentication phase
const AUTH_MESSAGES = [
  "Authenticating",
  "Authenticating.",
  "Authenticating..",
  "Authenticating...",
  "Verifying credentials...",
  "Access granted.",
];

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * DATA STRUCTURES
 * ═════════════════════════════════════════════════════════════════════════════
 */

interface LoginScreenProps {
  /** Called when login animation completes, signals readiness to show desktop */
  onLogin: () => void;
  radTopPct?: number;
  radBotPct?: number;
  overscanClass?: string;
}

/**
 * The login animation flows through distinct phases:
 * - "boot": System startup logs scroll down line by line
 * - "show": Brief pause showing the empty login form
 * - "type": Username and password are typed character by character
 * - "auth": Authentication status messages cycle through
 */
type Phase = "boot" | "show" | "type" | "auth";

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * MAIN COMPONENT
 * ═════════════════════════════════════════════════════════════════════════════
 */

export default function LoginScreen({ onLogin, radTopPct, radBotPct, overscanClass }: LoginScreenProps) {
  /**
   * ─────────────────────────────────────────────────────────────────────────
   * STATE: Component state drives the animation sequence
   * ─────────────────────────────────────────────────────────────────────────
   */

  const [bootLine, setBootLine] = useState(0); // Which system line to display (0-7)
  const [phase, setPhase] = useState<Phase>("boot"); // Current animation phase
  const [typedUser, setTypedUser] = useState(""); // Partial username typed so far
  const [typedPass, setTypedPass] = useState(""); // Partial password typed so far
  const [authIndex, setAuthIndex] = useState(0); // Which auth message to show (0-5)
  const [lastTypeAt, setLastTypeAt] = useState(0); // Timestamp of last typed character

  /**
   * onLoginRef prevents infinite update loops when onLogin() callback changes.
   * React effects would re-run if onLogin were in the dependency array,
   * but we store it in a ref so we always call the most current version.
   */
  const onLoginRef = useRef(onLogin);
  useEffect(() => {
    onLoginRef.current = onLogin;
  });

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * ANIMATION EFFECTS
   * ─────────────────────────────────────────────────────────────────────────
   * Each effect is responsible for one phase of the animation state machine.
   */

  /**
   * PHASE 1: Boot sequence
   * Lines scroll down with variable delays based on content.
   * When all lines complete, transition to the "show" phase.
   */
  useEffect(() => {
    if (phase !== "boot") return;

    if (bootLine >= SYSTEM_LINES.length) {
      // Boot sequence complete → transition to login form
      const t = setTimeout(() => setPhase("show"), TRANSITION_TO_TYPE_MS);
      return () => clearTimeout(t);
    }

    // Empty lines have shorter delay (smoother appearance)
    const delay = SYSTEM_LINES[bootLine] === "" ? BOOT_LINE_DELAY_EMPTY : BOOT_LINE_DELAY_FILLED;
    const t = setTimeout(() => setBootLine((n) => n + 1), delay);
    return () => clearTimeout(t);
  }, [phase, bootLine]);

  /**
   * PHASE 2: Show (brief pause)
   * Display the empty login form for a moment before typing starts.
   * This gives users time to register what's happening.
   */
  useEffect(() => {
    if (phase !== "show") return;

    const t = setTimeout(() => setPhase("type"), PAUSE_BEFORE_TYPE_MS);
    return () => clearTimeout(t);
  }, [phase]);

  /**
   * PHASE 3: Type credentials
   * Simulates typing the username, then the password, character by character.
   * Uses variable delays with random jitter to feel more human-like.
   */
  useEffect(() => {
    if (phase !== "type") return;

    const userDone = typedUser.length >= USERNAME.length;
    const passDone = typedPass.length >= PASSWORD.length;

    // Both fields complete → transition to auth phase
    if (userDone && passDone) {
      const t = setTimeout(() => setPhase("auth"), TRANSITION_TO_AUTH_MS);
      return () => clearTimeout(t);
    }

    // Type next character with randomized delay
    const t = setTimeout(() => {
      if (!userDone) {
        // Type one more character of username
        setTypedUser(USERNAME.slice(0, typedUser.length + 1));
        setLastTypeAt(Date.now());
      } else {
        // Username done, now type password
        setTypedPass(PASSWORD.slice(0, typedPass.length + 1));
        setLastTypeAt(Date.now());
      }
    }, TYPE_DELAY_MIN + Math.random() * TYPE_DELAY_RANDOM);

    return () => clearTimeout(t);
  }, [phase, typedUser, typedPass]);

  /**
   * PHASE 4: Authentication
   * Cycle through auth status messages ("Authenticating...", "Access granted.", etc.)
   * When all messages complete, call onLogin() to signal animation is done.
   */
  useEffect(() => {
    if (phase !== "auth") return;

    if (authIndex < AUTH_MESSAGES.length - 1) {
      // Show next auth message
      const t = setTimeout(() => setAuthIndex((n) => n + 1), AUTH_MESSAGE_DELAY);
      return () => clearTimeout(t);
    }

    // Final message shown → animation complete, signal parent component
    const t = setTimeout(() => onLoginRef.current(), LOGIN_COMPLETE_DELAY);
    return () => clearTimeout(t);
  }, [phase, authIndex]);

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * RENDER LOOP: Canvas drawing
   * ─────────────────────────────────────────────────────────────────────────
   * useCRTCanvas() wraps the Three.js renderer and offscreen canvas.
   * This callback is called every frame to render the login UI.
   */

  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Store animation state in a ref to avoid stale closures in the render loop.
   * Returns from useEffect's callback need consistent access to current state values.
   */
  const stateRef = useRef({ phase, bootLine, typedUser, typedPass, authIndex, lastTypeAt });
  useEffect(() => {
    stateRef.current = { phase, bootLine, typedUser, typedPass, authIndex, lastTypeAt };
  });

  useCRTCanvas(canvasRef, (ctx, w, h, t) => {
    const { phase: ph, bootLine: bl, typedUser: tu, typedPass: tp, authIndex: ai, lastTypeAt: lta } = stateRef.current;

    /**
     * ───────────────────────────────────────────────────────────────────────
     * LAYOUT CALCULATIONS
     * ───────────────────────────────────────────────────────────────────────
     * All positions and sizes are computed as percentages of screen dimensions
     * so the UI scales responsively across different display sizes.
     */

    const cx = w / 2; // Screen center X
    const panelW = Math.min(Math.max(560, w * 0.5), w * 0.9); // Panel width scales with screen on larger displays
    const panelX = cx - panelW / 2; // Left edge of centered panel
    const lh = Math.round(h * 0.036); // Line height: 3.6% of screen height
    const sz17 = Math.round(h * 0.030); // Font size for boot messages
    const sz20 = Math.round(h * 0.035); // Font size for labels and auth messages
    const glitchPhase = getGlitchPhase(t); // Idle glitch animation phase
    const typedCursorPulseVisible = Date.now() - lta <= TYPE_CURSOR_PULSE_MS;

    /**
     * ───────────────────────────────────────────────────────────────────────
     * BACKGROUND
     * ───────────────────────────────────────────────────────────────────────
     */

    // Clear screen and fill with CRT background color
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);

    // Add subtle radial gradient bloom from center (like CRT phosphor glow)
    const bloom = ctx.createRadialGradient(cx, h / 2, 0, cx, h / 2, w * CRT_BLOOM_RADIUS_FACTOR);
    bloom.addColorStop(0, ACCENT_RGBA_07);
    bloom.addColorStop(1, "transparent");
    ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, w, h);

    /**
     * ───────────────────────────────────────────────────────────────────────
     * BOOT PHASE: System startup logs in bordered box
     * ───────────────────────────────────────────────────────────────────────
     */

    const boxY = Math.round(h * 0.28); // Top of box: 28% down screen
    const boxPx = Math.round(panelW * 0.045); // Horizontal padding inside box
    const boxPy = Math.round(lh * 0.5); // Vertical padding inside box

    // Draw border around boot log
    ctx.strokeStyle = ACCENT_RGBA_40;
    ctx.lineWidth = 1;
    ctx.strokeRect(panelX, boxY, panelW, (SYSTEM_LINES.length + 1) * lh + boxPy * 2);

    // Draw each line of the boot sequence (up to current line)
    ctx.font = `${sz17}px ${FONT}`;
    ctx.fillStyle = ACCENT;
    ctx.shadowBlur = 8;
    ctx.shadowColor = ACCENT_RGBA_30;

    // Calculate cumulative delay for each line to stagger glitch animations
    let cumulativeDelay = 0; // in milliseconds
    for (let i = 0; i < bl; i++) {
      const line = SYSTEM_LINES[i];
      
      // Calculate how long this line has been visible (in seconds)
      const timeSinceLineAppeared = (t * 1000 - cumulativeDelay) / 1000;
      const lineGlitchPhase = BOOT_GLITCH_LINE_INDEXES.has(i)
        ? getGlitchIdlePhase(Math.max(0, timeSinceLineAppeared))
        : 0;
      
      glitchText(ctx, line || "", panelX + boxPx, boxY + boxPy + (i + 1) * lh, ACCENT, lineGlitchPhase);
      
      // Add delay for this line to calculate next line's cumulative delay
      const lineDelay = line === "" ? BOOT_LINE_DELAY_EMPTY : BOOT_LINE_DELAY_FILLED;
      cumulativeDelay += lineDelay;
    }

    ctx.shadowBlur = 0;

    /**
     * ───────────────────────────────────────────────────────────────────────
     * LOGIN PHASE: Username/password entry and auth status
     * ───────────────────────────────────────────────────────────────────────
     * Only draw the login form after boot phase completes.
     */

    if (ph !== "boot") {
      // Position login section below boot log
      const loginY = boxY + (SYSTEM_LINES.length + 2) * lh + boxPy * 2 + Math.round(lh * 0.8);

      // Draw section header with staggered glitch (header appears first after boot)
      ctx.font = `${sz20}px ${FONT}`;
      ctx.fillStyle = ACCENT_RGBA_60;
      ctx.shadowBlur = 6;
      ctx.shadowColor = ACCENT_RGBA_30;
      const headerGlitchPhase = getGlitchIdlePhase(Math.max(0, t - TRANSITION_TO_TYPE_MS / 1000));
      glitchText(ctx, "\u2500\u2500 USER IDENTIFICATION \u2500\u2500", panelX, loginY, ACCENT_RGBA_60, headerGlitchPhase);
      ctx.shadowBlur = 0;

      // Calculate row positions for input fields
      const row1Y = loginY + lh * 1.8; // Username row
      const row2Y = row1Y + lh * 1.4; // Password row
      const labelW = Math.round(panelW * 0.23); // Width reserved for labels (23% of panel)

      // Username line glitch phase (staggered 100ms after header)
      const usernameGlitchPhase = getGlitchIdlePhase(Math.max(0, t - (TRANSITION_TO_TYPE_MS + 100) / 1000));

      /**
       * USERNAME FIELD
       * Shows: "USERNAME: [typed_username][cursor]"
       */
      ctx.font = `${sz20}px ${FONT}`;
      glitchText(ctx, "USERNAME", panelX, row1Y, ACCENT_RGBA_70, usernameGlitchPhase);
      glitchText(ctx, ":", panelX + labelW, row1Y, ACCENT_RGBA_40, usernameGlitchPhase);
      ctx.fillStyle = ACCENT;
      ctx.shadowBlur = 8;
      ctx.shadowColor = ACCENT_RGBA_30;
      glitchText(ctx, tu, panelX + labelW + Math.round(lh * 0.6), row1Y, ACCENT, usernameGlitchPhase);

      // Show cursor briefly after each typed character
      if (ph === "type" && tu.length < USERNAME.length && typedCursorPulseVisible) {
        glitchText(
          ctx,
          "█",
          panelX + labelW + Math.round(lh * 0.6) + ctx.measureText(tu).width,
          row1Y,
          ACCENT,
          usernameGlitchPhase
        );
      }

      // Password line glitch phase (staggered 100ms after username)
      const passwordGlitchPhase = getGlitchIdlePhase(Math.max(0, t - (TRANSITION_TO_TYPE_MS + 200) / 1000));

      /**
       * PASSWORD FIELD
       * Shows: "PASSWORD: [typed_password][cursor]"
       * Password displays as bullet points (••••••••)
       */
      glitchText(ctx, "PASSWORD", panelX, row2Y, ACCENT_RGBA_70, passwordGlitchPhase);
      glitchText(ctx, ":", panelX + labelW, row2Y, ACCENT_RGBA_40, passwordGlitchPhase);
      ctx.shadowBlur = 8;
      glitchText(ctx, tp, panelX + labelW + Math.round(lh * 0.6), row2Y, ACCENT, passwordGlitchPhase);

      // Show cursor briefly after each typed character
      if (ph === "type" && tu.length >= USERNAME.length && tp.length < PASSWORD.length && typedCursorPulseVisible) {
        glitchText(
          ctx,
          "█",
          panelX + labelW + Math.round(lh * 0.6) + ctx.measureText(tp).width,
          row2Y,
          ACCENT,
          passwordGlitchPhase
        );
      }
      ctx.shadowBlur = 0;

      /**
       * AUTH MESSAGE
       * Shown during "auth" phase with cycling status messages.
       * Example: "Authenticating..." → "Access granted."
       */
      if (ph === "auth") {
        const authGlitchPhase = getGlitchIdlePhase(Math.max(0, t - (TRANSITION_TO_TYPE_MS + PAUSE_BEFORE_TYPE_MS + TRANSITION_TO_AUTH_MS) / 1000));
        ctx.font = `${sz17}px ${FONT}`;
        glitchText(ctx, AUTH_MESSAGES[ai], panelX, row2Y + lh * 1.6, ACCENT, authGlitchPhase);
      }
    }
  }, [], radTopPct, radBotPct);

  return (
    <CRTScreen overscanClass={overscanClass}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </CRTScreen>
  );
}
