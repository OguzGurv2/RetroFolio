"use client";

import { ComponentType, useEffect, useState } from "react";
import BootAnimation from "@/(mobile)/_components/BootAnimation";
import { OWNER } from "@/_config/owner";

// Minimum time to preload MobileHome in the background while boot animation plays.
// SPLASH_DURATION_MS (2200ms) > MIN_LOADING_MS (1500ms) so home is always ready
// before the animation finishes — no race condition possible.
const MIN_LOADING_MS    = 1500;
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
  if (!isFresh) localStorage.removeItem(LOGIN_STORAGE_KEY);
  return isFresh;
}

export default function MobileClient() {
  const [phase, setPhase] = useState<"boot" | "home">("boot");
  const [HomeComp, setHomeComp] = useState<ComponentType<Record<string, never>> | null>(null);

  useEffect(() => {
    const skipBoot = hasValidLoginCompletion();

    Promise.all([
      import("@/(mobile)/home/MobileHome").then((m) => m.default as ComponentType<Record<string, never>>),
      // Returning users skip straight to home — no artificial delay needed.
      // New visitors: wait at least MIN_LOADING_MS so home is ready when boot ends.
      skipBoot ? Promise.resolve() : minDelay(MIN_LOADING_MS),
    ]).then(([Comp]) => {
      setHomeComp(() => Comp);
      if (skipBoot) setPhase("home");
    });
  }, []);

  function handleBootComplete() {
    markLoginCompletedNow();
    setPhase("home");
    // HomeComp is guaranteed ready (MIN_LOADING_MS < SPLASH_DURATION_MS).
  }

  if (phase === "home" && HomeComp) return <HomeComp />;
  return <BootAnimation onLogin={handleBootComplete} ready={HomeComp !== null} />;
}

