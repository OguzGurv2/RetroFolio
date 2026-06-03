import MobileClient from "@/(mobile)/MobileClient";

// Statically generated at build time, served from CDN.
// Middleware rewrites / → /m for mobile UAs at the edge before this runs,
// so TTFB is CDN-fast and the server renders MobileClient to real HTML
// (loading screen visible on first byte — FCP improvement).
export default function MobilePage() {
  return <MobileClient />;
}
