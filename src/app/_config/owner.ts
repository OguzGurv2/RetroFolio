// =============================================================================
//  OWNER / IDENTITY  —  personal & SEO configuration
// =============================================================================
//
//  Fill this in with your own details.
//  Changes here propagate automatically to:
//    • Page <title> and meta description
//    • OpenGraph tags (link previews on Slack, Discord, social media)
//    • JSON-LD structured data (Google "Person" schema)
//    • robots.txt and sitemap.xml
//    • Web app manifest (name shown when added to home screen)
//    • Desktop boot/login animation (OS name, username, copyright)
//    • Mobile boot animation (OS name)
//    • Mobile top bar (OS name)
//    • Credit bar (your name + site link)
//    • Hidden SEO footer (crawlable text version of the portfolio)
//
//  FILES YOU MUST ALSO REPLACE MANUALLY
//  ─────────────────────────────────────
//  These are assets that cannot be driven from this file — replace them in
//  your file system before going live:
//
//    /public/favicon/favicon-16x16.png          ┐
//    /public/favicon/favicon-32x32.png          │  Your favicon set.
//    /public/favicon/apple-touch-icon.png       │  Generate all sizes at:
//    /public/favicon/android-chrome-192x192.png │  https://realfavicongenerator.net
//    /public/favicon/android-chrome-512x512.png ┘
//
//    /public/render/Sequence5_000.webp  ┐
//    /public/render/Sequence5_001.webp  │  The desktop intro animation.
//    … (125 frames total)               │  Replace all 125 frames with your
//    /public/render/Sequence5_124.webp  ┘  own render exported as webp images.
//
//    /public/social-preview.png           Social media preview image (1200×630).
//                                       Shown when someone shares your link on
//                                       Twitter/X, LinkedIn, Slack, etc.
//                                       Any image editor works — just export
//                                       as PNG at 1200×630px.
//
// =============================================================================

/**
 * Derives initials from a full name.
 * e.g. "John Doe" → "JD",  "Alice" → "A"
 * Used to auto-generate osName — override osName below if you prefer custom branding.
 */
export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// Set your name once here — it flows into `name` and auto-generates `osName`.
const _name = "Your Name";

export const OWNER = {
  // ── Identity ───────────────────────────────────────────────────────────────

  /** Your full name in plain ASCII — used in JSON-LD and copyright line. */
  name: _name,

  /** Your name with proper characters — shown in visible UI and SEO title. */
  displayName: "Your Name",

  /** Your job title — shown in JSON-LD and SEO title. */
  jobTitle: "Your Job Title",

  /** One or two sentence bio — used in the hidden SEO footer. */
  bio: "A sentence or two about your background — e.g. Former Software Engineer at Company and Computer Science graduate from University.",

  // ── Site ───────────────────────────────────────────────────────────────────

  /** Your portfolio's public URL — no trailing slash. */
  siteUrl: "https://www.yoursite.com",

  /**
   * BCP-47 language code for the HTML lang attribute.
   * Examples: "en", "de", "fr", "tr", "ja"
   * Affects screen readers and search engine language detection.
   */
  lang: "en",

  // ── SEO ────────────────────────────────────────────────────────────────────

  /**
   * Browser tab title and search result heading.
   * Tip: keep it under ~60 characters.
   */
  seoTitle: "Your Name – Your Job Title",

  /**
   * Search result snippet and social media preview description.
   * Tip: keep it under ~155 characters.
   */
  seoDescription:
    "A short description of you and what you build — e.g. Full-stack developer specialising in React, Next.js and Node.js.",

  // ── Social links ───────────────────────────────────────────────────────────

  github:   "https://github.com/yourusername",
  linkedin: "https://linkedin.com/in/yourprofile",
  email:    "you@example.com",

  // ── Social media preview image ─────────────────────────────────────────────

  /**
   * Image shown when your link is shared on Twitter/X, LinkedIn, Slack, etc.
   * Recommended size: 1200 × 630 px, PNG or JPEG.
   *
   * Steps:
   *   1. Design an image (any editor) at 1200×630px
   *   2. Save it as /public/social-preview.png
   *   3. This field is already set to the right URL — no change needed.
   *
   * Leave as-is if you haven't created one yet; the preview will just show
   * no image until you add the file.
   */
  socialImage: "/social-preview.png",

  // ── OS / Branding ──────────────────────────────────────────────────────────

  /**
   * The name of your OS — auto-derived from your initials (e.g. "JD-OS").
   * Override with any string if you prefer custom branding.
   */
  osName: `${getInitials(_name)}-OS`,

  /**
   * Username typed during the desktop login animation (purely cosmetic).
   * Change it to your own handle or name.
   */
  loginUsername: "your.username",

  // ── Analytics ──────────────────────────────────────────────────────────────

  /**
   * Google Analytics 4 measurement ID.
   * Format: "G-XXXXXXXXXX"
   * Leave as an empty string "" to disable GA entirely.
   */
  gaId: "",

  // ── Versioning ─────────────────────────────────────────────────────────────

  /**
   * Your portfolio version — displayed in the OS status bar and boot sequence.
   *
   * ─────────────────────────────────────────────────────────────────────────
   *  OPTION A  Manual version  (recommended — works everywhere)
   * ─────────────────────────────────────────────────────────────────────────
   *  Just type the version you want here, e.g.:
   *    version: "1.0.0"
   *
   *  Bump it whenever you deploy a meaningful update. Done.
   *  The build ID (short Git SHA) is set automatically by Vercel.
   *
   * ─────────────────────────────────────────────────────────────────────────
   *  OPTION B  Auto version from commit count  (advanced)
   * ─────────────────────────────────────────────────────────────────────────
   *  Set version: "" below, then follow these steps in Vercel:
   *
   *  Step 1 — Find your base SHA
   *    Run this in your repo terminal to get the SHA of your first commit
   *    (the one you want to count as v0.0.0):
   *      git log --oneline | tail -1
   *    Copy the 7-character SHA shown on the left.
   *
   *  Step 2 — Add environment variables in Vercel
   *    Go to: Vercel dashboard → your project → Settings → Environment Variables
   *    Add the following (all are "build" scope):
   *
   *      PORTFOLIO_REPO_OWNER   →  your GitHub username
   *      PORTFOLIO_REPO_NAME    →  your repository name
   *      PORTFOLIO_BASE_SHA     →  the SHA from Step 1
   *
   *  Step 3 — Add a GitHub token (secret)
   *    Go to: GitHub → Settings → Developer settings → Personal access tokens
   *    Create a Fine-grained token with read access to your repository.
   *    Back in Vercel, add it as:
   *      GITHUB_KEY   →  your token  (mark as "Sensitive")
   *
   *  Step 4 — Redeploy
   *    Trigger a new Vercel deployment. The version will now be calculated
   *    automatically from how many commits have been made since the base SHA.
   *    e.g. 42 commits → v0.4.2,  123 commits → v1.2.3
   *
   *  If none of the above is set the app shows v0.0.0 / unknown.
   */
  version: "1.0.0",
} as const;
