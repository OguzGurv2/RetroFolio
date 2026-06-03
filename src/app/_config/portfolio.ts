// =============================================================================
//  PORTFOLIO CONTENT  —  your one-stop CMS
// =============================================================================
//
//  This is the only file you need to edit to personalise this portfolio.
//  Changes here propagate automatically to:
//    • Desktop  — draggable OS windows
//    • Mobile   — swipeable section cards + bottom navigation
//    • SEO      — hidden HTML for search-engine crawlers
//
//  ┌─ QUICK START ────────────────────────────────────────────────────────────┐
//  │  1. Edit the ABOUT section below — it is the only mandatory section.    │
//  │  2. Uncomment any pre-made sections from sections-library.ts you want.   │
//  │  3. Add a matching nav item in MOBILE_NAV_ITEMS for each section.        │
//  │  4. Done — no component files need touching.                             │
//  └──────────────────────────────────────────────────────────────────────────┘
//
//  ICONS
//  ─────
//  Two options for the `icon` field:
//    Bootstrap Icons class  →  "bi-person-fill"   (https://icons.getbootstrap.com)
//    Custom image            →  "/icons/star.svg"  (place file in /public folder)
//
//  LINKS
//  ─────
//  • subtitleLink  — makes a section heading a clickable link
//  • bodyLinks     — makes specific body lines clickable
//    lineIndex is the 0-based position of the line inside `body`.
//
// =============================================================================

// ─ Pre-made section library ───────────────────────────────────────────────────
// Uncomment the ones you want to use, then add them to WINDOWS and MOBILE_NAV_ITEMS below.
// Each export has a .window and a .nav property ready to plug in.
// See src/app/_config/sections-library.ts for the full list and customisation tips.

// import { PROJECTS, SKILLS, CONTACT, EXPERIENCE, EDUCATION } from "./sections-library";

// ─ Types ─────────────────────────────────────────────────────────────────────

export interface WindowSection {
  /** Heading shown above this block of content. */
  subtitle: string;
  /** If set, the subtitle becomes a clickable link. */
  subtitleLink?: string;
  /** Lines of text displayed in this section. Each string is one line. */
  body: string[];
  /**
   * Makes individual body lines into clickable links.
   * `lineIndex` is the 0-based index of the line inside `body`.
   */
  bodyLinks?: Array<{ lineIndex: number; url: string }>;
}

export interface WindowTemplate {
  /**
   * Unique identifier — used as the URL key and to match nav items.
   * Use lowercase letters and hyphens only (e.g. "about", "open-source").
   */
  id: string;
  /** Title displayed in the window / page header. Shown in ALL-CAPS style. */
  title: string;
  /**
   * Bootstrap Icons class  →  "bi-person-fill"   (https://icons.getbootstrap.com)
   * Custom /public image   →  "/icons/star.svg"   (place your file in /public)
   */
  icon: string;
  /** One or more content sections inside this window / page. */
  sections: WindowSection[];
  /**
   * Desktop only — if true this window is open when the desktop first loads.
   * Only one window should be set to true at a time.
   */
  initiallyOpen?: boolean;
  /**
   * Adds a "See more →" link at the bottom of the window / page.
   * Useful for linking to a full GitHub profile, CV, etc.
   */
  seeMoreLink?: string;
}

// =============================================================================
//  WINDOWS  —  edit the content of each section here
// =============================================================================

export const WINDOWS: WindowTemplate[] = [

  // ---------------------------------------------------------------------------
  //  ABOUT  (mandatory — always keep this one)
  // ---------------------------------------------------------------------------
  {
    id: "about",
    title: "ABOUT.exe",
    icon: "bi-person-fill",
    initiallyOpen: true,              // ← this window opens automatically on desktop
    sections: [
      {
        subtitle: "Who am I?",
        body: [
          "Your role and location — e.g. Full-stack developer based in London.",
          "A sentence about what you build and what drives you.",
        ],
      },
      {
        subtitle: "Background",
        body: [
          "Current or most recent role @ Company (Year–Year).",
          "Degree · University Name (Year).",
          "Earlier experience or internship @ Company (Year).",
        ],
      },
      {
        subtitle: "Stack",
        body: ["Language · Framework · Tool · (add yours)"],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  //  Add more sections here from the library, e.g.:
  //
  //   PROJECTS.window,
  //   { ...PROJECTS.window, seeMoreLink: "https://github.com/you" },
  //
  //   SKILLS.window,
  //   CONTACT.window,
  //   EXPERIENCE.window,
  //   EDUCATION.window,
  // ---------------------------------------------------------------------------

];

// =============================================================================
//  MOBILE BOTTOM NAVIGATION
// =============================================================================
//
//  Controls which items appear in the mobile bottom nav and in what order.
//  • `id`   must match an id in WINDOWS above, or "home" for the home screen.
//  • `icon` Bootstrap Icons class OR a /public path (e.g. "/icons/home.svg").
//  • `label` accessibility label (not currently shown on-screen).
//
//  Add a nav entry for every section you added to WINDOWS.
//  Reorder entries here to change the navigation order.
//
// =============================================================================

export const MOBILE_NAV_ITEMS = [
  // Add your section nav items here, e.g.:
  // CONTACT.nav,
  { id: "about", icon: "bi-person-fill", label: "About" },
  { id: "home",  icon: "bi-house-fill",  label: "Home"  },
  // PROJECTS.nav,
  // SKILLS.nav,
] as const; // `as const` makes TypeScript infer the exact id values — do not remove it
