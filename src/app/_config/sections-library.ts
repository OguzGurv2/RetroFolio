// =============================================================================
//  SECTIONS LIBRARY  —  ready-made section templates
// =============================================================================
//
//  These are pre-built section templates you can drop straight into portfolio.ts.
//  Each entry exports a paired object with:
//    • .window  — the WindowTemplate to add to WINDOWS
//    • .nav     — the nav item to add to MOBILE_NAV_ITEMS
//
//  USAGE IN portfolio.ts
//  ──────────────────────
//  1. Import the section you want:
//       import { PROJECTS, SKILLS, CONTACT } from "./sections-library";
//
//  2. Add .window to WINDOWS:
//       export const WINDOWS = [
//         { id: "about", ... },   // your about section
//         PROJECTS.window,
//         SKILLS.window,
//       ];
//
//  3. Add .nav to MOBILE_NAV_ITEMS:
//       export const MOBILE_NAV_ITEMS = [
//         { id: "home", icon: "bi-house-fill", label: "Home" },
//         { id: "about", icon: "bi-person-fill", label: "About" },
//         PROJECTS.nav,
//         SKILLS.nav,
//       ];
//
//  4. Edit the template's content to match your own by spreading and overriding:
//       { ...PROJECTS.window, seeMoreLink: "https://github.com/you?tab=repositories" }
//
//  ICONS
//  ──────
//  All icons use Bootstrap Icons class names.
//  Browse the full set at → https://icons.getbootstrap.com
//
// =============================================================================

import type { WindowTemplate } from "./portfolio";

interface LibraryEntry {
  window: WindowTemplate;
  nav: { id: string; icon: string; label: string };
}

// ─────────────────────────────────────────────────────────────────────────────
//  PROJECTS
// ─────────────────────────────────────────────────────────────────────────────

export const PROJECTS: LibraryEntry = {
  window: {
    id: "projects",
    title: "PROJECTS.exe",
    icon: "bi-folder-fill",
    // Replace with your own GitHub profile or portfolio page
    seeMoreLink: "https://github.com/you?tab=repositories",
    sections: [
      {
        // Add a subtitleLink to make the heading a clickable link to the repo
        subtitle: "Project Name (Year)",
        subtitleLink: "https://github.com/you/your-project",
        body: [
          "A short description of what this project does and what tech it uses.",
        ],
      },
      {
        subtitle: "Another Project (Year)",
        body: [
          "Another short description. Add as many sections as you need.",
        ],
      },
    ],
  },
  nav: { id: "projects", icon: "bi-folder-fill", label: "Projects" },
};

// ─────────────────────────────────────────────────────────────────────────────
//  SKILLS
// ─────────────────────────────────────────────────────────────────────────────

export const SKILLS: LibraryEntry = {
  window: {
    id: "skills",
    title: "SKILLS.exe",
    icon: "bi-lightning-fill",
    sections: [
      {
        subtitle: "Languages",
        body: ["JavaScript · TypeScript · Python · (add yours)"],
      },
      {
        subtitle: "Frameworks & Libraries",
        body: ["React · Next.js · Node.js · (add yours)"],
      },
      {
        subtitle: "Tools & Platforms",
        body: ["Git · Docker · Figma · (add yours)"],
      },
    ],
  },
  nav: { id: "skills", icon: "bi-lightning-fill", label: "Skills" },
};

// ─────────────────────────────────────────────────────────────────────────────
//  CONTACT
// ─────────────────────────────────────────────────────────────────────────────

export const CONTACT: LibraryEntry = {
  window: {
    id: "contact",
    title: "CONTACT.exe",
    icon: "bi-telephone-fill",
    sections: [
      {
        subtitle: "Find me at",
        body: [
          "@   your.email@example.com",   // lineIndex 0
          "in  linkedin.com/in/you",      // lineIndex 1
          "gh  github.com/you",           // lineIndex 2
        ],
        bodyLinks: [
          { lineIndex: 0, url: "mailto:your.email@example.com" },
          { lineIndex: 1, url: "https://linkedin.com/in/you" },
          { lineIndex: 2, url: "https://github.com/you" },
        ],
      },
    ],
  },
  nav: { id: "contact", icon: "bi-telephone-fill", label: "Contact" },
};

// ─────────────────────────────────────────────────────────────────────────────
//  EXPERIENCE  (bonus template)
// ─────────────────────────────────────────────────────────────────────────────

export const EXPERIENCE: LibraryEntry = {
  window: {
    id: "experience",
    title: "EXPERIENCE.exe",
    icon: "bi-briefcase-fill",
    sections: [
      {
        subtitle: "Company Name (Year–Year)",
        subtitleLink: "https://company.com",
        body: [
          "Job title — one or two lines describing your role and impact.",
        ],
      },
      {
        subtitle: "Another Company (Year–Year)",
        body: [
          "Job title — one or two lines describing your role and impact.",
        ],
      },
    ],
  },
  nav: { id: "experience", icon: "bi-briefcase-fill", label: "Experience" },
};

// ─────────────────────────────────────────────────────────────────────────────
//  EDUCATION  (bonus template)
// ─────────────────────────────────────────────────────────────────────────────

export const EDUCATION: LibraryEntry = {
  window: {
    id: "education",
    title: "EDUCATION.exe",
    icon: "bi-mortarboard-fill",
    sections: [
      {
        subtitle: "Degree · University Name (Year)",
        subtitleLink: "https://university.edu",
        body: [
          "Field of study and any notable achievements or modules.",
        ],
      },
    ],
  },
  nav: { id: "education", icon: "bi-mortarboard-fill", label: "Education" },
};
