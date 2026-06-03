"use client";

import { useEffect, useRef, useState } from "react";

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * CONFIGURATION
 * ═════════════════════════════════════════════════════════════════════════════
 * These constants define the animation's behavior and visual properties.
 */

// Frame sequence settings
const FRAME_COUNT = 125; // Total number of images in the sequence
const AUTOPLAY_SPEED = 0.9; // How many frames to advance per animation frame (~60fps)

// Fade-out effect (fades canvas to let user scroll to next page)
const FADE_START_RATIO = 0.82; // Start fading when 82% through the animation
const FADE_DURATION_MS = 650; // Duration of fade-out in milliseconds

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * TAILWIND CLASSNAME CONSTANTS
 * ═════════════════════════════════════════════════════════════════════════════
 * Extracted as constants to keep JSX clean and improve maintainability.
 */

const viewportClassName = "fixed inset-0 z-0 isolate font-sans";
const canvasClassName = "absolute inset-0 z-0 block h-screen w-screen transition-opacity duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-opacity";
const hintClassName = "fixed pointer-events-none bottom-[calc(env(safe-area-inset-bottom)+1.75rem)] left-1/2 z-50 flex -translate-x-1/2 animate-[hint-slide-in_1s_ease-out] items-center gap-2 text-[#f2f2f2]";
const hintTextClassName = "text-[12px] tracking-[0.08em]";
const hintIconsClassName = "flex flex-col items-center gap-0.5";
const hintChevronClassName = "text-[12px]";
const hintChevronUpClassName = "animate-[hint-chevron-up_1.4s_ease-in-out_infinite]";
const hintMouseClassName = "text-[18px] leading-none";
const hintChevronDownClassName = "animate-[hint-chevron-down_1.4s_ease-in-out_infinite]";

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * DATA STRUCTURES
 * ═════════════════════════════════════════════════════════════════════════════
 */

interface IntroSequenceProps {
  /** Called when the entire animation sequence completes */
  onComplete?: () => void;
}

/** Stores decoded image data and dimensions for efficient rendering */
interface FrameData {
  img: HTMLImageElement; // The decoded image element
  iw: number; // Image width
  ih: number; // Image height
}

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * ASSET LOADING
 * ═════════════════════════════════════════════════════════════════════════════
 */

/**
 * Constructs the URL for a specific frame in the image sequence.
 * Example: getFrameSrc(0) → "/render/Sequence5_000.webp"
 */
function getFrameSrc(index: number): string {
  const padded = String(index).padStart(3, "0");
  return `/render/Sequence5_${padded}.webp`;
}

/**
 * Loads and decodes a single frame image asynchronously.
 * Using `img.decode()` ensures WebGPU/hardware acceleration is available before we use it.
 *
 * @param index - Which frame number to load
 * @param frames - Array to store the loaded frame data
 * @returns Promise that resolves when the frame is ready or fails gracefully
 */
function loadFrame(index: number, frames: FrameData[]): Promise<void> {
  const img = new Image();
  img.src = getFrameSrc(index);

  return new Promise<void>((resolve) => {
    const onReady = async () => {
      // Attempt to decode the image if the API is available
      // This pre-decodes on the GPU, making rendering smoother
      try {
        await img.decode();
      } catch {
        // If decode() fails, the fallback is to just draw anyway
        // (most modern browsers handle this automatically)
      }

      // Store the loaded frame data for later rendering
      frames[index] = {
        img,
        iw: img.naturalWidth,
        ih: img.naturalHeight,
      };
      resolve();
    };

    // Check if the image was already cached and is loaded
    if (img.complete && img.naturalWidth > 0) {
      onReady();
      return;
    }

    // Listen for when the image fully loads
    img.onload = () => onReady();
    // Handle broken images gracefully by resolving anyway
    img.onerror = () => resolve();
  });
}

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * RENDERING
 * ═════════════════════════════════════════════════════════════════════════════
 */

/**
 * Draws a single frame image to the canvas, centered and aspect-ratio-preserving.
 * This uses canvas scaling to fill the screen while maintaining the image's aspect ratio.
 *
 * Algorithm:
 * 1. Calculate the scale factor needed to cover the entire canvas
 * 2. Compute the scaled image dimensions
 * 3. Center the image on the canvas
 * 4. Draw it
 */
function drawFrameToCanvas(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  frame: FrameData,
) {
  const cw = canvas.width;
  const ch = canvas.height;
  const { img, iw, ih } = frame;

  // Use Math.max to ensure image covers entire canvas (like CSS 'cover')
  const scale = Math.max(cw / iw, ch / ih);
  const sw = iw * scale; // Scaled width
  const sh = ih * scale; // Scaled height

  // Center the scaled image on the canvas
  const sx = (cw - sw) / 2;
  const sy = (ch - sh) / 2;

  // Clear canvas and draw the frame
  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, sx, sy, sw, sh);
}

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * UI COMPONENTS
 * ═════════════════════════════════════════════════════════════════════════════
 */

/**
 * Animated hint shown while assets are loading.
 * Tells the user to scroll to start the animation.
 */
function IntroPrompt() {
  return (
    <div className={hintClassName}>
      <p className={hintTextClassName}>SCROLL DOWN TO START</p>
      <div className={hintIconsClassName}>
        <i
          className={`bi bi-chevron-compact-up ${hintChevronClassName} ${hintChevronUpClassName}`}
          aria-hidden="true"
        />
        <i className={`bi bi-mouse ${hintMouseClassName}`} aria-hidden="true" />
        <i
          className={`bi bi-chevron-compact-down ${hintChevronClassName} ${hintChevronDownClassName}`}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * MAIN COMPONENT
 * ═════════════════════════════════════════════════════════════════════════════
 */

export default function IntroSequence({ onComplete }: IntroSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false); // True when all frames are loaded
  const [hasStarted, setHasStarted] = useState(false); // True once user scrolls

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    const canvas = canvasElement;
    const context = canvas.getContext("2d", { desynchronized: true });
    if (!context) return;

    const ctx: CanvasRenderingContext2D = context;

    /**
     * ─────────────────────────────────────────────────────────────────────────
     * STATE VARIABLES
     * ─────────────────────────────────────────────────────────────────────────
     * These track the animation's current state throughout the effect lifecycle.
     */

    let cancelled = false; // Set to true on cleanup to prevent updates after unmount
    let lastDrawnFrame = -1; // Optimization: only redraw if frame index changes
    let fading = false; // True while fading out at the end
    let autoplaying = false; // True when actively playing the animation
    let allFramesReady = false; // True once all 125 frames are loaded
    let allowPageScroll = false; // True when user can scroll to next section
    let hasCompleted = false; // True once onComplete() has been called
    let currentProgress = 0; // Current frame position (can be fractional)

    // Animation frame and timeout references for cleanup
    let rafId: number | null = null;
    let fadeUnlockTimeoutId: number | null = null;

    // Precompute where fading should start
    const fadeStartFrame = Math.floor((FRAME_COUNT - 1) * FADE_START_RATIO);

    // Array to hold all loaded frame data
    const frames: FrameData[] = new Array(FRAME_COUNT);

    /**
     * ─────────────────────────────────────────────────────────────────────────
     * CANVAS SIZE MANAGEMENT
     * ─────────────────────────────────────────────────────────────────────────
     */

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    /**
     * ─────────────────────────────────────────────────────────────────────────
     * FRAME RENDERING
     * ─────────────────────────────────────────────────────────────────────────
     */

    function renderFrame(index: number) {
      const frame = frames[index];
      if (!frame) return;

      drawFrameToCanvas(ctx, canvas, frame);
    }

    /**
     * Animation loop called via requestAnimationFrame.
     * Responsible for:
     * 1. Advancing the animation frame if autoplaying
     * 2. Rendering the current frame
     * 3. Triggering fade-out when reaching the end
     * 4. Calling onComplete() callback
     */
    function render() {
      if (cancelled) return;

      // If autoplaying, advance the frame position
      if (autoplaying) {
        currentProgress = Math.min(FRAME_COUNT - 1, currentProgress + AUTOPLAY_SPEED);
      }

      // Convert fractional progress to frame index
      const frameIndex = Math.min(Math.round(currentProgress), FRAME_COUNT - 1);

      // Only redraw if the frame has changed (optimization)
      if (frameIndex !== lastDrawnFrame) {
        renderFrame(frameIndex);
        lastDrawnFrame = frameIndex;
      }

      // Trigger fade-out when reaching the end of the animation
      if (autoplaying && !fading && frameIndex >= fadeStartFrame) {
        fading = true;
        canvas.style.opacity = "0";

        // After fade completes, allow page scroll to the next section
        fadeUnlockTimeoutId = window.setTimeout(() => {
          if (cancelled) return;
          allowPageScroll = true;
        }, FADE_DURATION_MS);
      }

      // Stop animation when reaching the final frame
      if (autoplaying && frameIndex >= FRAME_COUNT - 1) {
        autoplaying = false;
        if (!hasCompleted) {
          hasCompleted = true;
          onComplete?.();
        }
        return;
      }

      // Continue the animation loop
      rafId = requestAnimationFrame(render);
    }

    /**
     * ─────────────────────────────────────────────────────────────────────────
     * EVENT HANDLERS
     * ─────────────────────────────────────────────────────────────────────────
     */

    /**
     * Handle scroll wheel events.
     * Prevents page scroll until animation is complete, then triggers autoplay.
     */
    function onWheel(event: WheelEvent) {
      // Block page scroll while animation is playing or fading
      if (!allowPageScroll) {
        event.preventDefault();
      }

      // Ignore scroll if animation is already playing or all frames aren't ready
      if (autoplaying || fading) return;
      if (!allFramesReady) return;
      // Ignore scroll-up events
      if (event.deltaY <= 0) return;

      // Start the animation
      autoplaying = true;
      setHasStarted(true);

      // Kick off the render loop if not already running
      if (rafId == null) {
        rafId = requestAnimationFrame(render);
      }
    }

    /**
     * Handle window resize events.
     * Resizes canvas and redraws the current frame.
     */
    function onResize() {
      resizeCanvas();
      lastDrawnFrame = -1; // Force redraw
      renderFrame(Math.min(Math.round(currentProgress), FRAME_COUNT - 1));
    }

    /**
     * ─────────────────────────────────────────────────────────────────────────
     * INITIALIZATION
     * ─────────────────────────────────────────────────────────────────────────
     */

    resizeCanvas();
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", onResize);

    // Load the first frame immediately for instant visual feedback
    loadFrame(0, frames).then(() => {
      if (cancelled) return;

      renderFrame(0);

      // Load remaining frames in parallel
      const remainingLoads: Promise<void>[] = [];
      for (let i = 1; i < FRAME_COUNT; i++) {
        remainingLoads.push(loadFrame(i, frames));
      }

      // Once all frames are loaded, signal readiness to the user
      Promise.all(remainingLoads).then(() => {
        if (cancelled) return;

        allFramesReady = true;
        allowPageScroll = true;
        setIsReady(true);
      });
    });

    /**
     * ─────────────────────────────────────────────────────────────────────────
     * CLEANUP
     * ─────────────────────────────────────────────────────────────────────────
     * Runs when component unmounts. Cancels pending operations and removes listeners.
     */
    return () => {
      cancelled = true;
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);

      // Clear any pending timeouts
      if (fadeUnlockTimeoutId != null) {
        clearTimeout(fadeUnlockTimeoutId);
      }

      // Cancel any pending animation frames
      if (rafId != null) {
        cancelAnimationFrame(rafId);
      }

      // Reset canvas opacity in case component unmounts during fade
      canvas.style.opacity = "1";
    };
  }, [onComplete]);

  return (
    <div className={viewportClassName}>
      <canvas ref={canvasRef} className={canvasClassName} />
      {/* Show the scroll hint while assets are loading */}
      {isReady && !hasStarted ? <IntroPrompt /> : null}
    </div>
  );
}
