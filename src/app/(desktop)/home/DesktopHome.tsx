"use client";

import { useEffect, useRef } from "react";
import { sendGAEvent } from "@next/third-parties/google";
import { useCRTCanvas } from "@/(desktop)/_components/crt/crtCanvas";
import CRTScreen from "@/(desktop)/_components/crt";
import { BARREL_K, GLITCH_CYCLE } from "@/(desktop)/_constants/crt";
import {
  TASKBAR_HEIGHT,
  buildWindowContent,
  closeButtonRect,
  createInitialWindows,
  drawDesktopFrame,
  findHoveredSubtitleLink,
  getWindowBodyHeight,
  getWindowRect,
  getWindowWidth,
  inRect,
  isInsideMask,
  loadDesktopState,
  saveDesktopState,
  taskbarButtonRects,
  titlebarRect,
} from "./canvas";
import { useLocale } from "@/_i18n/LocaleContext";
import { getWindows } from "@/_config/portfolio";

export default function Desktop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { locale } = useLocale();

  // Mutable runtime state is stored in refs to avoid React re-renders on mouse move.
  const winsRef = useRef(createInitialWindows(getWindows(locale)));
  const focusOrderRef = useRef<string[]>(loadDesktopState()?.focusOrder ?? winsRef.current.map((w) => w.id));
  const clockRef = useRef(new Date().toLocaleTimeString());
  const hoverBtnRef = useRef<string | null>(null);
  const hoverCloseRef = useRef<string | null>(null);
  const hoverSubtitleLinkRef = useRef<string | null>(null);
  const draggingRef = useRef<{ id: string; ox: number; oy: number; startX: number; startY: number } | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      clockRef.current = new Date().toLocaleTimeString();
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const templates = getWindows(locale);
    winsRef.current = winsRef.current.map((win) => {
      const template = templates.find((t) => t.id === win.id);
      if (!template) return win;
      const content = buildWindowContent(template);
      return {
        ...win,
        title: template.title,
        lines: content.lines,
        subtitleLinks: content.subtitleLinks,
        bodyLinks: content.bodyLinks,
        lineGlitchOffsets: content.lines.map(() => Math.random() * GLITCH_CYCLE),
      };
    });
  }, [locale]);

  useEffect(() => {
    const saveInterval = setInterval(() => {
      saveDesktopState(winsRef.current, focusOrderRef.current);
    }, 1000);

    const handleBeforeUnload = () => {
      saveDesktopState(winsRef.current, focusOrderRef.current);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      clearInterval(saveInterval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        saveDesktopState(winsRef.current, focusOrderRef.current);
        window.location.reload();
      }, 500);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeout) clearTimeout(resizeTimeout);
    };
  }, []);

  const handleRef = useCRTCanvas(canvasRef, (ctx, cw, ch, t) => {
    drawDesktopFrame(
      ctx,
      cw,
      ch,
      t,
      winsRef.current,
      focusOrderRef.current,
      clockRef.current,
      hoverBtnRef.current,
      hoverCloseRef.current,
      hoverSubtitleLinkRef.current,
    );
  }, []);

  useEffect(() => {
    const glCanvas = canvasRef.current;
    if (!glCanvas) return;

    const canvas: HTMLCanvasElement = glCanvas;

    function getCtx() {
      return handleRef.current?.ctx2d ?? null;
    }

    function focusWin(id: string) {
      const fo = focusOrderRef.current;
      const i = fo.indexOf(id);
      if (i !== -1) {
        fo.splice(i, 1);
        fo.push(id);
      }
    }

    function closeWin(id: string) {
      sendGAEvent("event", "window_close", { window_id: id });
      const win = winsRef.current.find((item) => item.id === id);
      if (win && !win.closing) {
        win.closing = true;
      }
    }

    function openWin(id: string) {
      sendGAEvent("event", "window_open", { window_id: id });
      const win = winsRef.current.find((item) => item.id === id);
      if (win) {
        win.closed = false;
        win.openAnim = 0;
        focusWin(id);
      }
    }

    function getPos(e: MouseEvent) {
      const ctx2d = getCtx();
      if (!ctx2d) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const sx = (e.clientX - rect.left) / rect.width;
      const sy = (e.clientY - rect.top) / rect.height;
      const cx = sx - 0.5;
      const cy = sy - 0.5;
      const r2 = cx * cx + cy * cy;

      return {
        x: (0.5 + cx * (1.0 + BARREL_K * r2)) * ctx2d.canvas.width,
        y: (0.5 + cy * (1.0 + BARREL_K * r2)) * ctx2d.canvas.height,
      };
    }

    function onMouseMove(e: MouseEvent) {
      const { x, y } = getPos(e);
      const ctx2d = getCtx();
      if (!ctx2d) return;

      const cw = ctx2d.canvas.width;
      const ch = ctx2d.canvas.height;
      const drag = draggingRef.current;

      if (drag) {
        const dx = x - drag.startX;
        const dy = y - drag.startY;
        const win = winsRef.current.find((item) => item.id === drag.id);
        if (win) {
          const ww = getWindowWidth(ctx2d, win);
          const wh = titlebarRect(ctx2d, win, cw, ch - TASKBAR_HEIGHT).h + getWindowBodyHeight(win, 1);
          if (win.centered) {
            const newOx = (cw - ww) / 2;
            const newOy = (ch - TASKBAR_HEIGHT - wh) / 2;
            draggingRef.current = { ...drag, ox: newOx, oy: newOy };
            win.x = newOx + dx;
            win.y = newOy + dy;
            win.centered = false;
          } else {
            win.x = drag.ox + dx;
            win.y = drag.oy + dy;
          }
          win.y = Math.max(0, Math.min(ch - TASKBAR_HEIGHT - wh, win.y));
          win.x = Math.max(0, Math.min(cw - ww, win.x));
        }
        return;
      }

      let cursor = "default";
      hoverCloseRef.current = null;
      hoverSubtitleLinkRef.current = null;

      const hoveredSubtitleLink = findHoveredSubtitleLink(
        ctx2d,
        winsRef.current,
        focusOrderRef.current,
        cw,
        ch,
        x,
        y,
      );
      if (hoveredSubtitleLink) {
        hoverSubtitleLinkRef.current = hoveredSubtitleLink.key;
        cursor = "pointer";
      }

      for (let fi = focusOrderRef.current.length - 1; fi >= 0; fi--) {
        const id = focusOrderRef.current[fi];
        const win = winsRef.current.find((item) => item.id === id);
        if (!win || win.closed || win.closing) continue;

        if (inRect(x, y, closeButtonRect(ctx2d, win, cw, ch - TASKBAR_HEIGHT)) && isInsideMask(x, y, cw, ch)) {
          hoverCloseRef.current = id;
          cursor = "pointer";
          break;
        }

        if (inRect(x, y, titlebarRect(ctx2d, win, cw, ch - TASKBAR_HEIGHT)) && isInsideMask(x, y, cw, ch)) {
          cursor = "grab";
          break;
        }
      }

      const rects = taskbarButtonRects(ctx2d, winsRef.current, cw, ch);
      hoverBtnRef.current = rects.find((rect) => inRect(x, y, rect))?.id ?? null;
      if (hoverBtnRef.current) cursor = "pointer";
      canvas.style.cursor = cursor;
    }

    function onMouseDown(e: MouseEvent) {
      if (e.button !== 0) return;

      const { x, y } = getPos(e);
      const ctx2d = getCtx();
      if (!ctx2d) return;

      const wins = winsRef.current;
      const fo = focusOrderRef.current;
      const cw = ctx2d.canvas.width;
      const ch = ctx2d.canvas.height;

      const hoveredSubtitleLink = findHoveredSubtitleLink(ctx2d, wins, fo, cw, ch, x, y);
      if (hoveredSubtitleLink) {
        sendGAEvent("event", "link_click", { url: hoveredSubtitleLink.url, label: hoveredSubtitleLink.key });
        window.open(hoveredSubtitleLink.url, "_blank", "noopener,noreferrer");
        return;
      }

      for (let fi = fo.length - 1; fi >= 0; fi--) {
        const id = fo[fi];
        const win = wins.find((item) => item.id === id);
        if (!win || win.closed) continue;
        if (inRect(x, y, closeButtonRect(ctx2d, win, cw, ch - TASKBAR_HEIGHT)) && isInsideMask(x, y, cw, ch)) {
          closeWin(id);
          return;
        }
      }

      for (let fi = fo.length - 1; fi >= 0; fi--) {
        const id = fo[fi];
        const win = wins.find((item) => item.id === id);
        if (!win || win.closed || win.closing) continue;

        const tr = titlebarRect(ctx2d, win, cw, ch - TASKBAR_HEIGHT);
        if (inRect(x, y, tr) && isInsideMask(x, y, cw, ch)) {
          focusWin(id);
          draggingRef.current = { id, ox: win.x, oy: win.y, startX: x, startY: y };
          canvas.style.cursor = "grabbing";
          return;
        }

        const { x: wx, y: wy, w: ww } = getWindowRect(ctx2d, win, cw, ch - TASKBAR_HEIGHT);
        if (inRect(x, y, { x: wx, y: wy, w: ww, h: tr.h + getWindowBodyHeight(win, win.openAnim) })) {
          focusWin(id);
          return;
        }
      }

      const rects = taskbarButtonRects(ctx2d, wins, cw, ch);
      const hit = rects.find((rect) => inRect(x, y, rect));
      if (hit) {
        const win = wins.find((item) => item.id === hit.id);
        if (win) {
          if (!win.closed) closeWin(hit.id);
          else openWin(hit.id);
        }
      }
    }

    function onMouseUp() {
      draggingRef.current = null;
      canvas.style.cursor = "";
    }

    function onMouseLeave() {
      hoverBtnRef.current = null;
      hoverSubtitleLinkRef.current = null;
    }

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseLeave);

    return () => {
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CRTScreen>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full cursor-default" />
    </CRTScreen>
  );
}
