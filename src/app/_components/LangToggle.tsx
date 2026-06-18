"use client";

import { useEffect, useState } from "react";
import { useLocale, type Locale } from "@/_i18n/LocaleContext";

interface LangToggleProps {
  availableLocales: Locale[];
}

export default function LangToggle({ availableLocales }: LangToggleProps) {
  const { locale, setLocale } = useLocale();
  const [color, setColor] = useState("rgba(0,255,133,0.35)");

  useEffect(() => {
    if (document.body.dataset.introActive === "1") {
      setColor("rgba(255,255,255,0.35)");
    }

    function onIntroDone() {
      setColor("rgba(0,255,133,0.35)");
    }

    window.addEventListener("og-intro-done", onIntroDone);
    return () => window.removeEventListener("og-intro-done", onIntroDone);
  }, []);

  if (availableLocales.length < 2) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        zIndex: 9999,
        fontFamily: "var(--font-body)",
        fontSize: "13px",
        letterSpacing: "0.15em",
        color,
        transition: "color 0.8s ease",
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      {availableLocales.flatMap((loc, i) => [
        i > 0 ? <span key={`sep-${i}`} style={{ opacity: 0.4 }}>·</span> : null,
        <button
          key={loc}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "inherit",
            fontFamily: "inherit",
            fontSize: "inherit",
            letterSpacing: "inherit",
            padding: 0,
            opacity: locale === loc ? 1 : 0.4,
            transition: "opacity 0.3s ease",
          }}
          onClick={() => setLocale(loc)}
        >
          {loc.toUpperCase()}
        </button>,
      ])}
    </div>
  );
}
