"use client";

import dynamic from "next/dynamic";

// Static fallback — middleware always rewrites / → /m or /d in production.
// Only reached if middleware is bypassed (e.g. direct static export testing).
const DesktopApp = dynamic(() => import("@/(desktop)/DesktopClient"), {
  ssr: false,
});

export default function Root() {
  return <DesktopApp />;
}
