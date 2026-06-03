/**
 * CreditBar
 *
 * A fixed "Built by <name>" credit strip pinned to the bottom of every page.
 * Mounted once in layout.tsx so it appears on both desktop and mobile.
 *
 * Colour behaviour:
 *   • White during the desktop intro sequence (so it blends with the white CRT boot)
 *   • Fades to green once the intro completes (or immediately on mobile / return visits)
 *
 * To remove the credit bar entirely, delete this component and its import from layout.tsx.
 */
"use client";

import { useEffect, useState } from "react";
import { OWNER } from "@/_config/owner";

export default function CreditBar() {
  // Default green — correct for mobile and returning desktop visitors (no intro).
  // Flips to white if the desktop intro sequence is active, then back to green on complete.
  const [color, setColor] = useState("rgba(0,255,133,0.35)");

  useEffect(() => {
    if (document.body.dataset.introActive === "1") {
      setColor("rgba(255,255,255,0.35)");
    }

    function onIntroDone() {
      setColor("rgba(0,255,133,0.35)");
      delete document.body.dataset.introActive;
    }

    window.addEventListener("og-intro-done", onIntroDone);
    return () => window.removeEventListener("og-intro-done", onIntroDone);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "10px",
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 9999,
        fontFamily: "var(--font-body)",
        fontSize: "13px",
        letterSpacing: "0.15em",
        color,
        transition: "color 0.8s ease",
      }}
    >
      <span>
        © {new Date().getFullYear()}&nbsp;
        <a
          href={OWNER.siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            pointerEvents: "auto",
            color: "inherit",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
          }}
        >
          {OWNER.displayName}
        </a>
        &nbsp;· All rights reserved.
      </span>
    </div>
  );
}
