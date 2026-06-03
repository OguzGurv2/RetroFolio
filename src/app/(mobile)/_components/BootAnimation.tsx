"use client";

import { useEffect, useRef } from "react";
import { BG, FONT } from "@/(desktop)/_constants/crt";
import { OS_BUILD_ID, OS_VERSION } from "@/_constants/version";
import { OWNER } from "@/_config/owner";
import {
  SPLASH_DURATION_MS,
  GLOW_HERO,
  GLOW_VERSION,
  GLOW_INIT,
  glitchIdleStyle,
} from "@/(mobile)/_constants/ui";

export default function MobileBootAnimation({ onLogin, ready }: { onLogin: () => void; ready: boolean }) {
  const onLoginRef = useRef(onLogin);
  useEffect(() => { onLoginRef.current = onLogin; });

  // When content is ready: cancel the CSS animation, snap the bar to 100%,
  // hold for 200 ms so the user sees the full bar, then exit.
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => onLoginRef.current(), 200);
    return () => clearTimeout(t);
  }, [ready]);

  // While content is still loading the bar fills via CSS over SPLASH_DURATION_MS.
  // Once ready=true we override width to 100% and kill the animation instantly.
  const barStyle: React.CSSProperties = ready
    ? { width: "100%", animation: "none", transition: "width 150ms ease", boxShadow: "0 0 8px rgba(0,255,133,0.9)" }
    : { boxShadow: "0 0 8px rgba(0,255,133,0.9)", animationDuration: `${SPLASH_DURATION_MS}ms` };

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ backgroundColor: BG, fontFamily: FONT }}
    >
      {/* Radial bloom */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 70% at 50% 50%, rgba(0,255,133,0.07) 0%, transparent 70%)",
        }}
      />
      {/* Scanlines — retro feel */}
      <div className="cyber-scanlines" />

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-10">

        {/* Logo block */}
        <div className="flex flex-col items-center gap-2">
          <p
            className="mob-text-hero text-glitch-idle"
            style={glitchIdleStyle(0, GLOW_HERO) as React.CSSProperties}
          >
            {OWNER.osName}
          </p>
          <p
            className="cyber-label text-glitch-idle"
            style={glitchIdleStyle(1, GLOW_VERSION) as React.CSSProperties}
          >
            v{OS_VERSION}&nbsp;&nbsp;[{OS_BUILD_ID}]
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-52 h-[3px] bg-[rgba(0,255,133,0.12)] relative overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-[#00ff85] boot-progress-bar"
              style={barStyle}
            />
          </div>
          <p
            className="cyber-label text-glitch-idle"
            style={glitchIdleStyle(2, GLOW_INIT) as React.CSSProperties}
          >
            INITIALISING
          </p>
        </div>

      </div>
    </div>
  );
}

