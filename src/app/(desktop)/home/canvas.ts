import {
  ACCENT,
  ACCENT_RGBA_07,
  ACCENT_RGBA_12,
  ACCENT_RGBA_20,
  ACCENT_RGBA_25,
  ACCENT_RGBA_30,
  ACCENT_RGBA_40,
  ACCENT_RGBA_50,
  ACCENT_RGBA_60,
  ACCENT_RGBA_70,
  ACCENT_RGBA_80,
  BG,
  BARREL_K,
  CRT_BLOOM_RADIUS_FACTOR,
  CRT_FLICKER_AMPLITUDE,
  CRT_FLICKER_FREQUENCY,
  FONT,
  GLITCH_CYCLE,
  drawGlitchText,
  getGlitchIdlePhase,
  getGlitchPhase,
  glitchText,
  DESKTOP_ACCENT_BORDER,
  DESKTOP_ACCENT_DIM,
  DESKTOP_LINE_HEIGHT,
  DESKTOP_MASK_RAD_BOT_PCT,
  DESKTOP_MASK_RAD_TOP_PCT,
  DESKTOP_TASKBAR_HEIGHT,
  DESKTOP_TITLEBAR_BG,
  DESKTOP_TITLEBAR_HEIGHT,
  DESKTOP_WINDOW_BG,
  DESKTOP_WINDOW_BORDER,
  DESKTOP_WINDOW_MIN_WIDTH,
  DESKTOP_WINDOW_PADDING,
} from "@/(desktop)/_constants/crt";
import { OS_BUILD_ID, OS_VERSION } from "@/_constants/version";
import { WINDOWS as INITIAL_WINDOWS, type WindowTemplate as DesktopWindowTemplate } from "@/_config/portfolio";
import { OWNER } from "@/_config/owner";

export interface SubtitleLinkMeta {
  lineIndex: number;
  text: string;
  url: string;
}

export interface BodyLinkMeta {
  lineIndex: number;
  text: string;
  url: string;
}

export interface DesktopWindow {
  id: string;
  title: string;
  lines: Array<[string, string]>;
  subtitleLinks: SubtitleLinkMeta[];
  bodyLinks: BodyLinkMeta[];
  x: number;
  y: number;
  closed: boolean;
  closing: boolean;
  centered: boolean;
  openAnim: number;
  /** Random per-window time offset (seconds) so windows don't all glitch simultaneously */
  glitchOffset: number;
  /** Per-line random offsets (in GLITCH_CYCLE domain) for fully independent line glitches */
  lineGlitchOffsets: number[];
}

// ---------------------------------------------------------------------------
// Layout + style constants
// ---------------------------------------------------------------------------
export const TASKBAR_HEIGHT = DESKTOP_TASKBAR_HEIGHT;
export const TITLEBAR_HEIGHT = DESKTOP_TITLEBAR_HEIGHT;
export const LINE_HEIGHT = DESKTOP_LINE_HEIGHT;
export const WINDOW_PADDING = DESKTOP_WINDOW_PADDING;
export const WINDOW_MIN_WIDTH = DESKTOP_WINDOW_MIN_WIDTH;

const ACCENT_DIM = DESKTOP_ACCENT_DIM;
const ACCENT_BORDER = DESKTOP_ACCENT_BORDER;
const WINDOW_BG = DESKTOP_WINDOW_BG;
const TITLEBAR_BG = DESKTOP_TITLEBAR_BG;
const WINDOW_BORDER = DESKTOP_WINDOW_BORDER;

// Keep these aligned with the rounded CRT mask.
const MASK_RAD_TOP_PCT = DESKTOP_MASK_RAD_TOP_PCT;
const MASK_RAD_BOT_PCT = DESKTOP_MASK_RAD_BOT_PCT;

// Content shaping rules (kept centralized for easier tuning).
const BODY_MAX_CHARS_PER_LINE = 78;
const SECTION_SPACER_LINES = 1;
/** How many seconds between each individual line's glitch fire */
const LINE_GLITCH_INTERVAL = 45;

// Automatic position offsets for non-centered windows.
const WINDOW_BASE_X = 160;
const WINDOW_BASE_Y = 90;
const WINDOW_STACK_OFFSET_X = 120;
const WINDOW_STACK_OFFSET_Y = 70;
const SUBTITLE_ICON = "▸";
const SUBTITLE_LINK_HOVER_ICON = "↗";
const LINK_HITBOX_HEIGHT = LINE_HEIGHT;

function barrelMap(sx: number, sy: number) {
  const cx = sx - 0.5;
  const cy = sy - 0.5;
  const r2 = cx * cx + cy * cy;
  const m = 1.0 + BARREL_K * r2;
  return { x: 0.5 + cx * m, y: 0.5 + cy * m };
}

function rrSdf(px: number, py: number, w: number, h: number, rTop: number, rBot: number) {
  const cx = px - w * 0.5;
  const cy = py - h * 0.5;
  const r = cy > 0 ? rTop : rBot;
  const qx = Math.abs(cx) - w * 0.5 + r;
  const qy = Math.abs(cy) - h * 0.5 + r;
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
}

/**
 * Returns how far the visible rounded edge starts from the left side at a given Y.
 * We use this to keep labels away from the curved corners.
 */
function maskLeftInsetAtY(cw: number, ch: number, yPx: number): number {
  const sy = Math.min(1, Math.max(0, yPx / ch));
  const rTop = cw * MASK_RAD_TOP_PCT;
  const rBot = cw * MASK_RAD_BOT_PCT;

  let lo = 0.0;
  let hi = 0.5;

  const dLoUv = barrelMap(lo, sy);
  const dLo = rrSdf(dLoUv.x * cw, dLoUv.y * ch, cw, ch, rTop, rBot);
  if (dLo <= 0) return 0;

  const dHiUv = barrelMap(hi, sy);
  const dHi = rrSdf(dHiUv.x * cw, dHiUv.y * ch, cw, ch, rTop, rBot);
  if (dHi >= 0) return cw * 0.5;

  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) * 0.5;
    const uv = barrelMap(mid, sy);
    const d = rrSdf(uv.x * cw, uv.y * ch, cw, ch, rTop, rBot);
    if (d > 0) lo = mid;
    else hi = mid;
  }

  return hi * cw;
}

function topSafeXRange(cw: number, ch: number, pad = 0) {
  const inset = maskLeftInsetAtY(cw, ch, 28);
  return {
    left: inset + pad,
    right: cw - inset - pad,
  };
}

function taskbarSafeXRange(cw: number, ch: number, pad = 0) {
  const y = ch - TASKBAR_HEIGHT;
  const inset = maskLeftInsetAtY(cw, ch, y + TASKBAR_HEIGHT * 0.5);
  return {
    left: inset + pad,
    right: cw - inset - pad,
  };
}

export function getWindowWidth(ctx: CanvasRenderingContext2D, win: DesktopWindow): number {
  ctx.font = `17px ${FONT}`;
  let maxW = 0;
  for (const [line] of win.lines) {
    maxW = Math.max(maxW, ctx.measureText(line).width + WINDOW_PADDING * 2);
  }
  return Math.max(WINDOW_MIN_WIDTH, maxW);
}

export function getWindowBodyHeight(win: DesktopWindow, progress: number): number {
  const full = win.lines.length * LINE_HEIGHT + WINDOW_PADDING * 2;
  return full * progress;
}

export function getWindowRect(ctx: CanvasRenderingContext2D, win: DesktopWindow, cw: number, ch: number) {
  const ww = getWindowWidth(ctx, win);
  const x = win.centered ? (cw - ww) / 2 : win.x;
  const y = win.centered
    ? (ch - (TITLEBAR_HEIGHT + win.lines.length * LINE_HEIGHT + WINDOW_PADDING * 2)) / 2
    : win.y;
  return { x, y, w: ww };
}

function drawWindow(
  ctx: CanvasRenderingContext2D,
  win: DesktopWindow,
  cw: number,
  ch: number,
  focused: boolean,
  closeHovered = false,
  hoverSubtitleLinkKey: string | null = null,
  timeSec = 0,
) {
  if (win.closed) return;

  const { x, y, w } = getWindowRect(ctx, win, cw, ch);
  const bh = getWindowBodyHeight(win, win.openAnim);
  const totalH = TITLEBAR_HEIGHT + bh;

  ctx.shadowBlur = focused ? 18 : 6;
  ctx.shadowColor = ACCENT_RGBA_12;

  ctx.fillStyle = WINDOW_BG;
  ctx.fillRect(x, y, w, totalH);

  ctx.strokeStyle = WINDOW_BORDER;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, totalH - 1);

  ctx.fillStyle = TITLEBAR_BG;
  ctx.fillRect(x, y, w, TITLEBAR_HEIGHT);

  ctx.strokeStyle = ACCENT_BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + TITLEBAR_HEIGHT);
  ctx.lineTo(x + w, y + TITLEBAR_HEIGHT);
  ctx.stroke();

  ctx.font = `18px ${FONT}`;
  ctx.fillStyle = ACCENT;
  ctx.shadowBlur = 8;
  ctx.shadowColor = ACCENT_RGBA_50;
  glitchText(ctx, win.title, x + WINDOW_PADDING, y + TITLEBAR_HEIGHT - 6, ACCENT, getGlitchPhase(timeSec + win.glitchOffset));
  ctx.shadowBlur = 0;

  ctx.font = `16px ${FONT}`;
  ctx.fillStyle = closeHovered ? ACCENT : ACCENT_DIM;
  if (closeHovered) {
    ctx.shadowBlur = 10;
    ctx.shadowColor = ACCENT_RGBA_70;
  }
  ctx.fillText("✕", x + w - 24, y + TITLEBAR_HEIGHT - 6);
  ctx.shadowBlur = 0;

  if (bh > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y + TITLEBAR_HEIGHT, w, bh);
    ctx.clip();

    ctx.font = `17px ${FONT}`;
    for (let i = 0; i < win.lines.length; i++) {
      const [text, color] = win.lines[i];
      if (!text) continue;

      const textX = x + WINDOW_PADDING;
      const textY = y + TITLEBAR_HEIGHT + WINDOW_PADDING + (i + 1) * LINE_HEIGHT - 4;
      const tLocal = (timeSec + win.lineGlitchOffsets[i]) % LINE_GLITCH_INTERVAL;
      // The glitch fires at full speed in the last GLITCH_CYCLE seconds of the interval.
      // Outside that window the line is always phase 0 (still).
      const linePhase = tLocal >= LINE_GLITCH_INTERVAL - GLITCH_CYCLE
        ? getGlitchIdlePhase(tLocal - (LINE_GLITCH_INTERVAL - GLITCH_CYCLE))
        : 0;
      const subtitleLink = win.subtitleLinks.find((link) => link.lineIndex === i);
      const bodyLink = win.bodyLinks.find((link) => link.lineIndex === i);
      const isSubtitle = color === ACCENT;

      // Only add icon to subtitle lines
      if (!isSubtitle) {
        // Body text rendering
        if (!bodyLink) {
          // Non-linked body text: idle glitch
          ctx.shadowBlur = 6;
          ctx.shadowColor = ACCENT_RGBA_25;
          glitchText(ctx, text, textX, textY, color, linePhase);
          continue;
        }

        // Linked body text: underline and glitch on hover
        const hoverKey = `${win.id}:body:${bodyLink.lineIndex}`;
        const isHovered = hoverSubtitleLinkKey === hoverKey;

        ctx.shadowBlur = isHovered ? 10 : 6;
        ctx.shadowColor = isHovered ? ACCENT_RGBA_70 : ACCENT_RGBA_25;

        if (isHovered) {
          const progress = (Math.sin(timeSec * 5) + 1) * 0.5;
          drawGlitchText(ctx, text, textX, textY, color, { mode: "in", progress });
        } else {
          glitchText(ctx, text, textX, textY, color, linePhase);
        }

        // Draw underline for body links
        ctx.strokeStyle = isHovered ? ACCENT : ACCENT_RGBA_50;
        ctx.lineWidth = 1;
        const textWidth = ctx.measureText(text).width;
        ctx.beginPath();
        ctx.moveTo(textX, textY + 2);
        ctx.lineTo(textX + textWidth, textY + 2);
        ctx.stroke();
        continue;
      }

      if (!subtitleLink) {
        // Non-linked subtitle: idle glitch
        const fullText = `${SUBTITLE_ICON} ${text}`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = ACCENT_RGBA_25;
        glitchText(ctx, fullText, textX, textY, color, linePhase);
        continue;
      }

      // Linked subtitle: animated icon on hover + underline
      const hoverKey = `${win.id}:${subtitleLink.lineIndex}`;
      const isHovered = hoverSubtitleLinkKey === hoverKey;
      const icon = isHovered ? SUBTITLE_LINK_HOVER_ICON : SUBTITLE_ICON;
      const fullText = `${icon} ${text}`;

      ctx.shadowBlur = isHovered ? 10 : 6;
      ctx.shadowColor = isHovered ? ACCENT_RGBA_70 : ACCENT_RGBA_25;

      if (isHovered) {
        const progress = (Math.sin(timeSec * 5) + 1) * 0.5;
        drawGlitchText(ctx, fullText, textX, textY, ACCENT, { mode: "in", progress });
      } else {
        glitchText(ctx, fullText, textX, textY, ACCENT, linePhase);
      }

      // Draw underline for links
      ctx.strokeStyle = isHovered ? ACCENT : ACCENT_RGBA_50;
      ctx.lineWidth = 1;
      const textWidth = ctx.measureText(fullText).width;
      ctx.beginPath();
      ctx.moveTo(textX, textY + 2);
      ctx.lineTo(textX + textWidth, textY + 2);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

function drawTaskbar(
  ctx: CanvasRenderingContext2D,
  wins: DesktopWindow[],
  cw: number,
  ch: number,
  clock: string,
  hoverBtn: string | null,
) {
  const y = ch - TASKBAR_HEIGHT;
  const safe = taskbarSafeXRange(cw, ch, 0);
  const labelX = safe.left + 8;

  ctx.fillStyle = BG;
  ctx.fillRect(0, y, cw, TASKBAR_HEIGHT);
  ctx.strokeStyle = ACCENT_BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, y + 0.5);
  ctx.lineTo(cw, y + 0.5);
  ctx.stroke();

  ctx.font = `18px ${FONT}`;
  ctx.fillStyle = ACCENT;
  ctx.shadowBlur = 8;
  ctx.shadowColor = ACCENT_RGBA_40;
  ctx.fillText(OWNER.osName, labelX, y + TASKBAR_HEIGHT - 8);
  ctx.shadowBlur = 0;

  const sepX = labelX + ctx.measureText(OWNER.osName).width + 12;
  ctx.strokeStyle = ACCENT_BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sepX, y + 8);
  ctx.lineTo(sepX, y + TASKBAR_HEIGHT - 8);
  ctx.stroke();

  let bx = sepX + 10;
  ctx.font = `17px ${FONT}`;
  for (const win of wins) {
    const isOpen = !win.closed;
    const isHover = hoverBtn === win.id;
    const btnW = ctx.measureText(win.title).width + 18;

    ctx.strokeStyle = isOpen
      ? ACCENT_RGBA_60
      : isHover
        ? ACCENT_RGBA_50
        : ACCENT_RGBA_20;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, y + 5.5, btnW - 1, TASKBAR_HEIGHT - 11);

    ctx.fillStyle = isOpen
      ? ACCENT
      : isHover
        ? ACCENT_RGBA_80
        : ACCENT_RGBA_40;
    ctx.fillText(win.title, bx + 9, y + TASKBAR_HEIGHT - 9);

    bx += btnW + 6;
  }

  ctx.font = `17px ${FONT}`;
  ctx.fillStyle = ACCENT_RGBA_60;
  const cw2 = ctx.measureText(clock).width;
  ctx.fillText(clock, safe.right - cw2, y + TASKBAR_HEIGHT - 8);
}

export function taskbarButtonRects(ctx: CanvasRenderingContext2D, wins: DesktopWindow[], cw: number, ch: number) {
  const y = ch - TASKBAR_HEIGHT;
  const rects: { id: string; x: number; y: number; w: number; h: number }[] = [];
  const safe = taskbarSafeXRange(cw, ch, 8);
  const labelX = safe.left + 8;
  // Must match the font used in drawTaskbar so that hit-box positions align
  // with where the buttons are actually drawn.
  ctx.font = `18px ${FONT}`;
  const sepX = labelX + ctx.measureText(OWNER.osName).width + 12;
  let bx = sepX + 10;
  ctx.font = `17px ${FONT}`;
  for (const win of wins) {
    const btnW = ctx.measureText(win.title).width + 18;
    rects.push({ id: win.id, x: bx, y: y + 5, w: btnW, h: TASKBAR_HEIGHT - 10 });
    bx += btnW + 6;
  }
  return rects;
}

export function titlebarRect(ctx: CanvasRenderingContext2D, win: DesktopWindow, cw: number, ch: number) {
  const { x, y, w } = getWindowRect(ctx, win, cw, ch);
  return { x, y, w, h: TITLEBAR_HEIGHT };
}

export function closeButtonRect(ctx: CanvasRenderingContext2D, win: DesktopWindow, cw: number, ch: number) {
  const { x, y, w } = getWindowRect(ctx, win, cw, ch);
  return { x: x + w - 28, y, w: 28, h: TITLEBAR_HEIGHT };
}

export function inRect(px: number, py: number, r: { x: number; y: number; w: number; h: number }) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export function isInsideMask(px: number, py: number, cw: number, ch: number): boolean {
  const rTop = cw * MASK_RAD_TOP_PCT;
  const rBot = cw * MASK_RAD_BOT_PCT;
  return rrSdf(px, py, cw, ch, rTop, rBot) <= 0;
}

function wrapByCharLimit(text: string, maxChars: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (current.length === 0) {
      if (word.length <= maxChars) {
        current = word;
        continue;
      }

      // Split very long uninterrupted tokens (URLs, etc.) to avoid overflow.
      for (let i = 0; i < word.length; i += maxChars) {
        lines.push(word.slice(i, i + maxChars));
      }
      continue;
    }

    const candidate = `${current} ${word}`;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    lines.push(current);
    if (word.length <= maxChars) {
      current = word;
      continue;
    }

    for (let i = 0; i < word.length; i += maxChars) {
      const chunk = word.slice(i, i + maxChars);
      if (chunk.length === maxChars || i + maxChars < word.length) {
        lines.push(chunk);
      } else {
        current = chunk;
      }
    }
    if (word.length % maxChars === 0) {
      current = "";
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

export function buildWindowContent(template: DesktopWindowTemplate): {
  lines: Array<[string, string]>;
  subtitleLinks: SubtitleLinkMeta[];
  bodyLinks: BodyLinkMeta[];
} {
  const lines: Array<[string, string]> = [];
  const subtitleLinks: SubtitleLinkMeta[] = [];
  const bodyLinks: BodyLinkMeta[] = [];

  for (let sectionIndex = 0; sectionIndex < template.sections.length; sectionIndex++) {
    const section = template.sections[sectionIndex];
    const lineIndex = lines.length;
    lines.push([section.subtitle, ACCENT]);
    if (section.subtitleLink) {
      subtitleLinks.push({
        lineIndex,
        text: section.subtitle,
        url: section.subtitleLink,
      });
    }

    let bodyLineIndexInSection = 0;
    for (const bodyText of section.body) {
      const wrapped = wrapByCharLimit(bodyText, BODY_MAX_CHARS_PER_LINE);
      for (const line of wrapped) {
        const currentLineIndex = lines.length;
        lines.push([line, ACCENT_RGBA_80]);

        // Check if this body line has a link
        if (section.bodyLinks) {
          const bodyLink = section.bodyLinks.find((bl) => bl.lineIndex === bodyLineIndexInSection);
          if (bodyLink) {
            bodyLinks.push({
              lineIndex: currentLineIndex,
              text: line,
              url: bodyLink.url,
            });
          }
        }
      }
      bodyLineIndexInSection++;
    }

    if (section.liveDemoLink) {
      const liveDemoLineIndex = lines.length;
      lines.push(["▶ Live Demo", ACCENT_RGBA_80]);
      bodyLinks.push({ lineIndex: liveDemoLineIndex, text: "▶ Live Demo", url: section.liveDemoLink });
    }

    if (sectionIndex < template.sections.length - 1) {
      for (let i = 0; i < SECTION_SPACER_LINES; i++) {
        lines.push(["", ""]);
      }
    }
  }

  // Keep bottom breathing room equal to section spacing.
  if (lines.length > 0) {
    for (let i = 0; i < SECTION_SPACER_LINES; i++) {
      lines.push(["", ""]);
    }
  }

  // "See more" link — rendered as a linked subtitle at the very bottom.
  if (template.seeMoreLink) {
    const label = template.seeMoreLabel ?? "See more repositories";
    const lineIndex = lines.length;
    lines.push([label, ACCENT]);
    subtitleLinks.push({ lineIndex, text: label, url: template.seeMoreLink });
  }

  return { lines, subtitleLinks, bodyLinks };
}

function getAutoWindowPosition(index: number): { x: number; y: number } {
  const step = Math.max(0, index - 1);
  return {
    x: WINDOW_BASE_X + step * WINDOW_STACK_OFFSET_X,
    y: WINDOW_BASE_Y + step * WINDOW_STACK_OFFSET_Y,
  };
}

// The desktop's window layout and focus order are persisted so the user
// returns to the same arrangement on their next visit.
export const DESKTOP_STATE_STORAGE_KEY = `${OWNER.osName.toLowerCase()}-desktop-state`;

export function saveDesktopState(wins: DesktopWindow[], focusOrder: string[]) {
  const state = {
    wins: wins.map((w) => ({ id: w.id, x: w.x, y: w.y, closed: w.closed })),
    focusOrder,
  };
  localStorage.setItem(DESKTOP_STATE_STORAGE_KEY, JSON.stringify(state));
}

export function loadDesktopState(): { wins: Partial<DesktopWindow>[]; focusOrder: string[] } | null {
  try {
    const stored = localStorage.getItem(DESKTOP_STATE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function createInitialWindows(templates: DesktopWindowTemplate[] = INITIAL_WINDOWS): DesktopWindow[] {
  const cached = loadDesktopState();
  const initialWins = templates.map((template, index) => {
    const isFirst = index === 0;
    const autoPos = getAutoWindowPosition(index);
    const content = buildWindowContent(template);

    return {
      id: template.id,
      title: template.title,
      lines: content.lines,
      subtitleLinks: content.subtitleLinks,
      bodyLinks: content.bodyLinks,
      x: autoPos.x,
      y: autoPos.y,
      closed: template.initiallyOpen ? false : !isFirst,
      centered: isFirst,
      openAnim: 0,
      closing: false,
      glitchOffset: Math.random() * GLITCH_CYCLE,
      lineGlitchOffsets: content.lines.map(() => Math.random() * GLITCH_CYCLE),
    };
  });

  if (!cached) {
    return initialWins;
  }

  return initialWins.map((win) => {
    const template = templates.find((item) => item.id === win.id);
    const cachedWin = cached.wins.find((cw) => cw.id === win.id);

    // Explicit template visibility should win over cached visibility.
    const closedFromTemplate =
      typeof template?.initiallyOpen === "boolean" ? !template.initiallyOpen : undefined;

    return {
      ...win,
      x: cachedWin?.x ?? win.x,
      y: cachedWin?.y ?? win.y,
      closed: closedFromTemplate ?? cachedWin?.closed ?? win.closed,
    };
  });
}

export function drawDesktopFrame(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  t: number,
  wins: DesktopWindow[],
  focusOrder: string[],
  clock: string,
  hoverBtn: string | null,
  hoverCloseId: string | null,
  hoverSubtitleLinkKey: string | null,
) {
  for (const win of wins) {
    if (win.closing) {
      win.openAnim = Math.max(0, win.openAnim - 0.06);
      if (win.openAnim === 0) {
        win.closed = true;
        win.closing = false;
      }
    } else if (!win.closed && win.openAnim < 1) {
      win.openAnim = Math.min(1, win.openAnim + 0.04);
    }
  }

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, cw, ch);

  const bloom = ctx.createRadialGradient(cw / 2, ch / 2, 0, cw / 2, ch / 2, cw * CRT_BLOOM_RADIUS_FACTOR);
  bloom.addColorStop(0, ACCENT_RGBA_07);
  bloom.addColorStop(1, "transparent");
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, cw, ch);

  const glitchPhase = getGlitchPhase(t);

  ctx.font = `14px ${FONT}`;
  ctx.shadowBlur = 0;
  const topSafe = topSafeXRange(cw, ch, 10);
  glitchText(ctx, `${OWNER.osName} DESKTOP v${OS_VERSION} [${OS_BUILD_ID}]`, topSafe.left, 28, ACCENT_RGBA_30, glitchPhase);

  for (const id of focusOrder) {
    const w = wins.find((win) => win.id === id);
    if (w) {
      drawWindow(
        ctx,
        w,
        cw,
        ch - TASKBAR_HEIGHT,
        id === focusOrder[focusOrder.length - 1],
        hoverCloseId === id,
        hoverSubtitleLinkKey,
        t,
      );
    }
  }

  drawTaskbar(ctx, wins, cw, ch, clock, hoverBtn);

  const flick = CRT_FLICKER_AMPLITUDE * (0.5 + 0.5 * Math.sin(t * CRT_FLICKER_FREQUENCY));
  ctx.fillStyle = `rgba(0,0,0,${flick})`;
  ctx.fillRect(0, 0, cw, ch);
}

export function subtitleLinkRect(
  ctx: CanvasRenderingContext2D,
  win: DesktopWindow,
  link: SubtitleLinkMeta,
  cw: number,
  ch: number,
) {
  const { x, y } = getWindowRect(ctx, win, cw, ch);
  const lineY = y + TITLEBAR_HEIGHT + WINDOW_PADDING + (link.lineIndex + 1) * LINE_HEIGHT - 4;
  const textX = x + WINDOW_PADDING;
  const fullText = `${SUBTITLE_ICON} ${link.text}`;
  const textW = ctx.measureText(fullText).width;

  return {
    x: textX,
    y: lineY - LINK_HITBOX_HEIGHT + 6,
    w: textW,
    h: LINK_HITBOX_HEIGHT,
  };
}

export function bodyLinkRect(
  ctx: CanvasRenderingContext2D,
  win: DesktopWindow,
  link: BodyLinkMeta,
  cw: number,
  ch: number,
) {
  const { x, y } = getWindowRect(ctx, win, cw, ch);
  const lineY = y + TITLEBAR_HEIGHT + WINDOW_PADDING + (link.lineIndex + 1) * LINE_HEIGHT - 4;
  const textX = x + WINDOW_PADDING;
  const textW = ctx.measureText(link.text).width;

  return {
    x: textX,
    y: lineY - LINK_HITBOX_HEIGHT + 6,
    w: textW,
    h: LINK_HITBOX_HEIGHT,
  };
}

export function findHoveredSubtitleLink(
  ctx: CanvasRenderingContext2D,
  wins: DesktopWindow[],
  focusOrder: string[],
  cw: number,
  ch: number,
  px: number,
  py: number,
) {
  for (let fi = focusOrder.length - 1; fi >= 0; fi--) {
    const id = focusOrder[fi];
    const win = wins.find((item) => item.id === id);
    if (!win || win.closed || win.closing) continue;

    // Check subtitle links first
    for (const link of win.subtitleLinks) {
      const rect = subtitleLinkRect(ctx, win, link, cw, ch - TASKBAR_HEIGHT);
      const visibleBodyH = getWindowBodyHeight(win, win.openAnim);
      const bodyTop = getWindowRect(ctx, win, cw, ch - TASKBAR_HEIGHT).y + TITLEBAR_HEIGHT;
      const bodyBottom = bodyTop + visibleBodyH;
      const isVisible = rect.y + rect.h >= bodyTop && rect.y <= bodyBottom;
      if (!isVisible) continue;

      if (inRect(px, py, rect)) {
        // Check if any window in front is covering this click point
        let isObstructed = false;
        for (let checkFi = focusOrder.length - 1; checkFi > fi; checkFi--) {
          const checkId = focusOrder[checkFi];
          const checkWin = wins.find((item) => item.id === checkId);
          if (!checkWin || checkWin.closed) continue;

          const checkWinRect = getWindowRect(ctx, checkWin, cw, ch - TASKBAR_HEIGHT);
          const checkWinBodyH = getWindowBodyHeight(checkWin, checkWin.openAnim);
          const checkWinTotalH = TITLEBAR_HEIGHT + checkWinBodyH;
          const checkRect = { x: checkWinRect.x, y: checkWinRect.y, w: checkWinRect.w, h: checkWinTotalH };
          
          if (inRect(px, py, checkRect)) {
            isObstructed = true;
            break;
          }
        }

        if (!isObstructed) {
          return {
            key: `${win.id}:${link.lineIndex}`,
            winId: win.id,
            url: link.url,
          };
        }
      }
    }

    // Check body links
    for (const link of win.bodyLinks) {
      const rect = bodyLinkRect(ctx, win, link, cw, ch - TASKBAR_HEIGHT);
      const visibleBodyH = getWindowBodyHeight(win, win.openAnim);
      const bodyTop = getWindowRect(ctx, win, cw, ch - TASKBAR_HEIGHT).y + TITLEBAR_HEIGHT;
      const bodyBottom = bodyTop + visibleBodyH;
      const isVisible = rect.y + rect.h >= bodyTop && rect.y <= bodyBottom;
      if (!isVisible) continue;

      if (inRect(px, py, rect)) {
        // Check if any window in front is covering this click point
        let isObstructed = false;
        for (let checkFi = focusOrder.length - 1; checkFi > fi; checkFi--) {
          const checkId = focusOrder[checkFi];
          const checkWin = wins.find((item) => item.id === checkId);
          if (!checkWin || checkWin.closed) continue;

          const checkWinRect = getWindowRect(ctx, checkWin, cw, ch - TASKBAR_HEIGHT);
          const checkWinBodyH = getWindowBodyHeight(checkWin, checkWin.openAnim);
          const checkWinTotalH = TITLEBAR_HEIGHT + checkWinBodyH;
          const checkRect = { x: checkWinRect.x, y: checkWinRect.y, w: checkWinRect.w, h: checkWinTotalH };
          
          if (inRect(px, py, checkRect)) {
            isObstructed = true;
            break;
          }
        }

        if (!isObstructed) {
          return {
            key: `${win.id}:body:${link.lineIndex}`,
            winId: win.id,
            url: link.url,
          };
        }
      }
    }
  }

  return null;
}
