"use client";

import dynamic from "next/dynamic";

// Three.js/WebGL cannot run on the server — skip SSR entirely.
// Middleware rewrites / → /d for desktop UAs at the edge before this page runs.
const DesktopApp = dynamic(() => import("@/(desktop)/DesktopClient"), {
  ssr: false,
});

export default function DesktopPage() {
  return <DesktopApp />;
}
