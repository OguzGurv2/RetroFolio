import { NextRequest, NextResponse } from "next/server";

// Matches phone-class mobile UAs. iPads intentionally excluded — they report
// a desktop Safari UA and belong to the desktop layout.
// Google PageSpeed Insights mobile crawl uses an Android/Mobile UA.
const MOBILE_UA_RE = /android.*mobile|iphone|ipod|blackberry|iemobile|opera mini/i;

/**
 * Runs at Vercel's edge network (same tier as the CDN, globally distributed,
 * ~0 ms overhead). Rewrites / → /m or /d before the request ever touches a
 * serverless function, so both target pages can remain fully static and be
 * served straight from the CDN cache.
 *
 * The URL the user (and Google) sees is always "/". The rewrite is internal.
 */
export function middleware(request: NextRequest) {
  const ua = request.headers.get("user-agent") ?? "";
  const target = MOBILE_UA_RE.test(ua) ? "/m" : "/d";

  const url = request.nextUrl.clone();
  url.pathname = target;
  return NextResponse.rewrite(url);
}

// Only intercept the root path — leave all other routes, API calls,
// and static assets completely untouched.
export const config = {
  matcher: ["/"],
};
