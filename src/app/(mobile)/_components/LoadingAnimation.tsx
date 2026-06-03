"use client";

import { BG, FONT } from "@/(desktop)/_constants/crt";
import { GLOW_BODY } from "@/(mobile)/_constants/ui";

export default function MobileLoadingScreen() {
  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ backgroundColor: BG, fontFamily: FONT }}
    >
      {/* Radial bloom */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,255,133,0.07) 0%, transparent 70%)`,
        }}
      />
      {/* Scanlines */}
      <div className="cyber-scanlines" />

      {/* Loading text — top-left, matching desktop position */}
      <p
        className="absolute mob-text-body text-glitch select-none"
        style={{
          top: "5%",
          left: "5%",
          "--glow": GLOW_BODY,
        } as React.CSSProperties}
      >
        Loading<span className="loading-dots" />
      </p>
    </div>
  );
}
