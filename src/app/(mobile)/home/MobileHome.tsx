"use client";

import { useState } from "react";
import { sendGAEvent } from "@next/third-parties/google";
import { TopBar }  from "@/(mobile)/_components/TopBar";
import { Clock }   from "@/(mobile)/_components/Clock";
import { BottomNav }     from "@/(mobile)/_components/BottomBar";
import { WindowContent } from "@/(mobile)/_components/WindowPage";
import { getWindows, type WindowTemplate } from "@/_config/portfolio";
import { useLocale } from "@/_i18n/LocaleContext";
import { glitchIdleStyle } from "@/(mobile)/_constants/ui";
import WindowIcon from "@/_components/WindowIcon";

type ViewId = "home" | "about" | "projects" | "skills" | "contact";
type AnimState = "idle" | "out" | "in";
type Direction  = "ltr" | "rtl";

const VIEW_ORDER: Record<ViewId, number> = {
   contact: 0, about: 1, home: 2, projects: 3, skills: 4, 
};

function TeaserCard({ win, index, onOpen }: { win: WindowTemplate; index: number; onOpen: () => void }) {
  const preview = win.sections[0].body[0];
  return (
    <button
      onClick={onOpen}
      className={`cyber-panel flex flex-col gap-2 text-left w-full active:scale-[0.97] transition-transform duration-100 ${index % 2 === 0 ? 'mob-glitch-enter-from-left' : 'mob-glitch-enter-from-right'}`}
      style={{ animationDelay: `${Math.floor(index / 2) * 60}ms` }}
    >
      {/* header row */}
      <div className="flex items-start justify-between">
        <WindowIcon icon={win.icon} size="text-[2rem]" />
      </div>

      {/* title */}
      <p
        className="cyber-label text-[14px] tracking-[0.18em] leading-tight text-glitch-idle"
        style={glitchIdleStyle(index * 2) as React.CSSProperties}
      >{win.title}</p>

      {/* preview */}
      <p className="cyber-dim text-[11px] leading-relaxed" style={{
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}>
        {preview}
      </p>

      {/* CTA */}
      <span
        className="cyber-label text-[12px] tracking-[0.3em] mt-auto pt-1 border-t border-[rgba(0,255,133,0.12)] flex items-center gap-1 text-glitch-idle"
        style={glitchIdleStyle(index * 2 + 1) as React.CSSProperties}
      >
        OPEN <i className="bi bi-arrow-right leading-none align-middle" />
      </span>
    </button>
  );
}

export default function MobileHome() {
  const { locale } = useLocale();
  const WINDOWS = getWindows(locale);
  const [view, setView] = useState<ViewId>("home");
  const [animState, setAnimState] = useState<AnimState>("idle");
  const [direction, setDirection] = useState<Direction>("ltr");
  const [pendingView, setPendingView] = useState<ViewId | null>(null);

  function navigate(id: ViewId) {
    if (id === view || animState !== "idle") return;
    sendGAEvent("event", "section_navigate", { section_id: id });
    setDirection(VIEW_ORDER[id] >= VIEW_ORDER[view] ? "ltr" : "rtl");
    setPendingView(id);
    setAnimState("out");
  }

  function handleAnimEnd(e: React.AnimationEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    if (e.animationName.startsWith("mob-glitch-exit")) {
      setView(pendingView!);
      setPendingView(null);
      setAnimState("in");
    } else if (e.animationName.startsWith("mob-glitch-enter")) {
      setAnimState("idle");
    }
  }

  const contentCls =
    animState === "out" ? (direction === "ltr" ? "mob-glitch-exit-left"        : "mob-glitch-exit-right")       :
    animState === "in"  ? (direction === "ltr" ? "mob-glitch-enter-from-right"  : "mob-glitch-enter-from-left") :
    "";

  return (
    <div className="cyber-bg fixed inset-0 flex flex-col overflow-hidden">
      <div className="cyber-scanlines pointer-events-none" />

        <TopBar />

      <div className="flex-1 relative overflow-hidden">

        <div
          className={`h-full overflow-y-auto overflow-x-hidden px-3 pt-2 pb-2 flex flex-col ${contentCls}`}
          onAnimationEnd={handleAnimEnd}
        >
          {view === "home" ? (
            <>
              <Clock />
              <p className="cyber-dim text-[10px] tracking-[0.3em] mb-2 px-1 text-glitch-idle">
                // SELECT_MODULE
              </p>
              <div className="grid grid-cols-2 gap-2">
                {WINDOWS.map((win, i) => (
                  <TeaserCard
                    key={win.id}
                    win={win}
                    index={i}
                    onOpen={() => navigate(win.id as ViewId)}
                  />
                ))}
              </div>
            </>
          ) : (
            <WindowContent id={view} />
          )}
        </div>
      </div>

      <BottomNav activeId={view} onNavigate={(id) => navigate(id as ViewId)} />
    </div>
  );
}
