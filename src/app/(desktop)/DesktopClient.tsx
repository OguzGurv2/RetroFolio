"use client";

import { ComponentType, useEffect, useState } from "react";

import IntroSequence from "@/(desktop)/_components/IntroSequence";
import LoadingScreen from "@/(desktop)/_components/LoadingAnimation";
import {
  DESKTOP_CRT_RAD_TOP_PCT,
  DESKTOP_CRT_RAD_BOT_PCT,
  DESKTOP_OVERSCAN,
} from "@/(desktop)/_constants/crt";
import { DESKTOP_STATE_STORAGE_KEY } from "@/(desktop)/home/canvas";
import { OWNER } from "@/_config/owner";

// Keep the loading screen visible long enough to feel intentional.
const MIN_LOADING_MS = 1500;
const LOGIN_STORAGE_KEY = `${OWNER.osName.toLowerCase()}-login-completed`;
const LOGIN_SKIP_TTL_MS = 10 * 60 * 1000; // 10 minutes

function minDelay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function markLoginCompletedNow() {
  localStorage.setItem(LOGIN_STORAGE_KEY, String(Date.now()));
}

function hasValidLoginCompletion(): boolean {
  const stored = localStorage.getItem(LOGIN_STORAGE_KEY);
  if (!stored) return false;

  // Backward compatibility for legacy boolean storage.
  if (stored === "true") {
    markLoginCompletedNow();
    return true;
  }

  const completedAt = Number(stored);
  if (!Number.isFinite(completedAt)) {
    localStorage.removeItem(LOGIN_STORAGE_KEY);
    return false;
  }

  const isFresh = Date.now() - completedAt < LOGIN_SKIP_TTL_MS;
  if (!isFresh) {
    localStorage.removeItem(LOGIN_STORAGE_KEY);
  }

  return isFresh;
}

type DesktopPhase = "scroll" | "loading" | "login" | "desktop";

function loadDesktopPage(): Promise<ComponentType<Record<string, never>>> {
  return Promise.all([
    import("@/(desktop)/home/DesktopHome").then((m) => m.default),
    minDelay(MIN_LOADING_MS),
  ]).then(([Comp]) => Comp as ComponentType<Record<string, never>>);
}

export default function DesktopApp() {
  // Phase drives which full-screen screen is currently shown.
  const [phase, setPhase] = useState<DesktopPhase>("scroll");
  const [LoginComp, setLoginComp] = useState<ComponentType<{ onLogin: () => void; radTopPct?: number; radBotPct?: number; overscanClass?: string }> | null>(null);
  const [DesktopComp, setDesktopComp] = useState<ComponentType<Record<string, never>> | null>(null);

  useEffect(() => {
    // If the user already completed login before, skip the intro sequence.
    const didLoginBefore = hasValidLoginCompletion();
    if (!didLoginBefore) {
      // Intro will play — tell CreditBar to show white until it completes.
      document.body.dataset.introActive = "1";
      return;
    }

    setPhase("loading");
    loadDesktopPage().then((Comp) => {
      setDesktopComp(() => Comp);
      setPhase("desktop");
    });
  }, []);

  function showLoginScreen() {
    setPhase("loading");
    Promise.all([
      import("@/(desktop)/_components/LoginAnimation").then((m) => m.default),
      minDelay(MIN_LOADING_MS),
    ]).then(([Comp]) => {
      setLoginComp(() => Comp);
      setPhase("login");
    });
  }

  function handleScrollComplete() {
    // Coming from the intro should always start desktop windows from their default layout.
    localStorage.removeItem(DESKTOP_STATE_STORAGE_KEY);

    // Signal CreditBar to switch from white to green.
    window.dispatchEvent(new CustomEvent("og-intro-done"));

    // The scroll intro is done; now transition to login.
    showLoginScreen();
  }

  function handleLoginComplete() {
    // Save state so the next visit can skip the intro animation.
    markLoginCompletedNow();
    setPhase("loading");
    loadDesktopPage().then((Comp) => {
      setDesktopComp(() => Comp);
      setPhase("desktop");
    });
  }

  if (phase === "scroll") {
    return (
      <div className="fixed inset-0 z-50">
        <IntroSequence onComplete={handleScrollComplete} />
      </div>
    );
  }

  if (phase === "loading") {
    return <LoadingScreen radTopPct={DESKTOP_CRT_RAD_TOP_PCT} radBotPct={DESKTOP_CRT_RAD_BOT_PCT} overscanClass={DESKTOP_OVERSCAN} />;
  }

  if (phase === "login" && LoginComp) {
    return <LoginComp onLogin={handleLoginComplete} radTopPct={DESKTOP_CRT_RAD_TOP_PCT} radBotPct={DESKTOP_CRT_RAD_BOT_PCT} overscanClass={DESKTOP_OVERSCAN} />;
  }

  if (phase === "desktop" && DesktopComp) {
    return <DesktopComp />;
  }

  return <LoadingScreen />;
}
