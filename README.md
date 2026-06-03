# Retro OS Portfolio

A retro-cyberpunk developer portfolio built with **Next.js 15**, **Three.js**, and **Tailwind CSS v4**.

Desktop visitors get a fully interactive OS simulation — draggable windows, a taskbar, a boot/login sequence, and a CRT post-processing shader. Mobile visitors get a smooth SPA-style cyberpunk UI with animated transitions, a bottom navigation bar, and a glitching clock widget.

Everything that makes this portfolio _yours_ lives in two files: **`src/app/_config/owner.ts`** and **`src/app/_config/portfolio.ts`**. No component code needs to be touched.

---

## Live demo

> Replace this with your own URL after deploying.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Making it your own](#making-it-your-own)
  - [Step 1 — Fill in owner.ts](#step-1--fill-in-ownerts)
  - [Step 2 — Replace public assets](#step-2--replace-public-assets)
  - [Step 3 — Add your content in portfolio.ts](#step-3--add-your-content-in-portfoliots)
- [Versioning](#versioning)
- [Deploying to Vercel](#deploying-to-vercel)
- [Project structure](#project-structure)
- [Architecture notes](#architecture-notes)
- [Customising the theme](#customising-the-theme)
- [License](#license)

---

## Features

| Feature                      | Description                                                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **CRT shader**               | WebGL post-processing: barrel distortion, scanlines, chromatic aberration, vignette, flicker, rounded-corner masking            |
| **Desktop OS simulation**    | Draggable, closeable windows drawn on an offscreen 2D canvas, composited through the CRT material each frame                    |
| **Intro sequence**           | 125-frame WebP image sequence played back on a `<canvas>` with scroll-driven autoplay and hardware-accelerated fade             |
| **Login animation**          | Retro boot log + credential-typing animation before the desktop appears                                                         |
| **Adaptive routing**         | Root page detects viewport at the edge (Vercel middleware) and rewrites to `/d` or `/m` — zero JS shipped for the unused branch |
| **Session persistence**      | Boot animation is skipped for 10 minutes after the user has already seen it                                                     |
| **Window state persistence** | Desktop window positions and open/close state are saved to `localStorage` and restored on the next visit                        |
| **Mobile SPA**               | Fully client-side section navigation — no sub-routes, no page reloads                                                           |
| **Versioning**               | Pin a version string manually in `owner.ts`, or configure auto-versioning from commit count via the GitHub Compare API          |
| **SEO**                      | JSON-LD Person schema, OpenGraph tags, Twitter card, hidden crawlable footer (because the desktop renders on `<canvas>`)        |
| **Web manifest**             | Dynamic `manifest.ts` — app name and short name come from `owner.ts` automatically                                              |
| **Analytics**                | Optional Google Analytics 4, Vercel Analytics, and Vercel Speed Insights — all configurable or removable                        |

---

## Tech stack

| Layer        | Technology                                                               |
| ------------ | ------------------------------------------------------------------------ |
| Framework    | [Next.js 15](https://nextjs.org/) (App Router, TypeScript)               |
| 3D / Shaders | [Three.js 0.184](https://threejs.org/) — custom GLSL CRT ShaderMaterial  |
| Styling      | [Tailwind CSS v4](https://tailwindcss.com/)                              |
| Icons        | [Bootstrap Icons](https://icons.getbootstrap.com/) (self-hosted woff2)   |
| Font         | [VT323](https://fonts.google.com/specimen/VT323) via `next/font/google`  |
| Deployment   | [Vercel](https://vercel.com/)                                            |
| Analytics    | Vercel Analytics · Vercel Speed Insights · Google Analytics 4 (optional) |

---

## Getting started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9 — install with `npm i -g pnpm`

### Install and run locally

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The root URL `/` automatically redirects to `/d` (desktop) or `/m` (mobile) based on your browser's user-agent. To force a specific layout during development, navigate directly to one of those paths.

### Build

```bash
pnpm build
pnpm start
```

---

## Making it your own

There are three steps. You do not need to touch any component file.

### Step 1 — Fill in owner.ts

Open **`src/app/_config/owner.ts`** and fill in every field. Every comment explains what each field does and where it appears in the UI.

| Field                           | What it affects                                                                  |
| ------------------------------- | -------------------------------------------------------------------------------- |
| `name` / `displayName`          | JSON-LD, SEO title, copyright line in the login animation                        |
| `jobTitle`                      | SEO title, JSON-LD                                                               |
| `bio`                           | Hidden SEO footer                                                                |
| `siteUrl`                       | `robots.txt`, `sitemap.xml`, OpenGraph URL, social image URL                     |
| `lang`                          | HTML `lang` attribute — set to your language code e.g. `"tr"`, `"de"`            |
| `seoTitle`                      | Browser tab, search result heading, OpenGraph title                              |
| `seoDescription`                | Search result snippet, OpenGraph description, Twitter card                       |
| `github` / `linkedin` / `email` | JSON-LD `sameAs`, hidden SEO footer                                              |
| `socialImage`                   | OpenGraph image, Twitter card image — place file at `/public/social-preview.png` |
| `osName`                        | Auto-derived from your initials (e.g. `"JD-OS"`) — override if you prefer        |
| `loginUsername`                 | Cosmetic username typed during the desktop login animation                       |
| `gaId`                          | Google Analytics 4 measurement ID — leave `""` to disable                        |
| `version`                       | Displayed in the OS status bar and boot sequence — see [Versioning](#versioning) |

### Step 2 — Replace public assets

These files cannot be driven from `owner.ts` — replace them manually before going live.

**Favicons** — generate all sizes at [realfavicongenerator.net](https://realfavicongenerator.net) and drop the files into `/public/`:

```
/public/favicon-16x16.png
/public/favicon-32x32.png
/public/apple-touch-icon.png
/public/android-chrome-192x192.png
/public/android-chrome-512x512.png
```

**Social preview image** — design a 1200 × 630 px image in any editor and save it as:

```
/public/social-preview.png
```

This is shown when someone shares your link on Twitter/X, LinkedIn, Slack, iMessage, etc.

**Desktop intro animation** — the 125 frames in `/public/render/` are the original creator's 3D render. Replace them with your own:

1. Create or render a 125-frame animation (any tool — Blender, After Effects, etc.)
2. Export all frames as WebP images
3. Name them `Sequence5_000.webp` through `Sequence5_124.webp`
4. Drop them into `/public/render/` replacing the existing files

> If you want a different frame count or naming scheme, update the constants at the top of `src/app/(desktop)/_components/IntroSequence.tsx`.

### Step 3 — Add your content in portfolio.ts

Open **`src/app/_config/portfolio.ts`**. This is your content CMS.

#### The `about` section (mandatory)

Edit the pre-populated `about` window with your own information:

```ts
export const WINDOWS: WindowTemplate[] = [
  {
    id: "about",
    title: "ABOUT.exe",
    icon: "bi-person-fill",
    sections: [
      {
        subtitle: "Who am I?",
        body: [
          "Your role and location.",
          "What you build and what drives you.",
        ],
      },
      {
        subtitle: "Background",
        body: [
          "Current role @ Company (Year–Year).",
          "Degree · University (Year).",
        ],
      },
      {
        subtitle: "Stack",
        body: ["TypeScript · React · Node.js · (your stack)"],
      },
    ],
  },
];
```

#### Adding more sections

`src/app/_config/sections-library.ts` contains five ready-made templates: **PROJECTS**, **SKILLS**, **CONTACT**, **EXPERIENCE**, and **EDUCATION**.

To add one, uncomment its import at the top of `portfolio.ts` and add it to `WINDOWS` and `MOBILE_NAV_ITEMS`:

```ts
import { PROJECTS, SKILLS, CONTACT } from "./sections-library";

export const WINDOWS: WindowTemplate[] = [
  { id: "about", ... },   // your about section
  PROJECTS.window,
  SKILLS.window,
  CONTACT.window,
];

export const MOBILE_NAV_ITEMS = [
  { id: "home",    icon: "bi-house-fill",    label: "Home"     },
  { id: "about",   icon: "bi-person-fill",   label: "About"    },
  PROJECTS.nav,
  SKILLS.nav,
  CONTACT.nav,
];
```

Override any field by spreading:

```ts
{
  ...PROJECTS.window,
  seeMoreLink: "https://github.com/your-username?tab=repositories",
}
```

#### Section links

```ts
{
  subtitle: "My Project",
  subtitleLink: "https://github.com/you/project",   // makes the heading a link
  body: [
    "A description of the project.",
    "Built with TypeScript and React.",
  ],
  bodyLinks: [
    { lineIndex: 1, url: "https://reactjs.org" },   // makes body[1] a link
  ],
}
```

#### Icons

Two options for the `icon` field on any window or nav item:

- **Bootstrap Icons class** — `"bi-person-fill"` — browse at [icons.getbootstrap.com](https://icons.getbootstrap.com)
- **Custom image path** — `"/icons/star.svg"` — place the file in `/public/` and use the path starting with `/`

---

## Versioning

The version string is displayed in the OS status bar (mobile top bar and desktop glitch overlay) and in the boot/login sequence.

Configure it in `owner.ts` under the `version` field.

### Option A — Manual (recommended)

Set a version string directly:

```ts
version: "1.0.0",
```

Bump it whenever you deploy a meaningful update. Works in local dev and production. The build ID (short Git SHA) is set automatically by Vercel.

### Option B — Auto from commit count (advanced, deploy-only)

> ⚠ This does **not** work in local development. Locally the app will always show `v0.0.0 / unknown`. It only takes effect after a live Vercel deployment with the variables below configured.

Set `version: ""` in `owner.ts`, then configure these in your Vercel project's **Environment Variables** (build scope):

| Variable                                   | Description                                                                                              |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `PORTFOLIO_REPO_OWNER`                     | Your GitHub username                                                                                     |
| `PORTFOLIO_REPO_NAME`                      | Your repository name                                                                                     |
| `PORTFOLIO_BASE_SHA`                       | The commit SHA to treat as `v0.0.0` — run `git log --oneline \| tail -1` to find your first commit's SHA |
| `GITHUB_KEY` / `GITHUB_TOKEN` / `GH_TOKEN` | A GitHub fine-grained PAT with repository read access — mark as **Sensitive** in Vercel                  |

`VERCEL_GIT_COMMIT_SHA` is set automatically by Vercel.

Version scheme: 42 commits since base → `v0.4.2` · 123 commits → `v1.2.3`

---

## Deploying to Vercel

1. Push your repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new) — framework is detected automatically
3. If using auto-versioning (Option B), add the environment variables listed above
4. Deploy

The `vercel.json` at the repo root sets the framework to `nextjs` — no further configuration needed.

---

## Project structure

```
src/
├── middleware.ts               # Edge UA detection → rewrites / to /d or /m
└── app/
    ├── layout.tsx              # Root layout — metadata, JSON-LD, analytics, credit bar
    ├── page.tsx                # Root page — triggers the middleware rewrite
    ├── globals.css             # Tailwind v4 base + cyber utility classes + keyframes
    ├── manifest.ts             # Dynamic web app manifest (uses owner.ts)
    ├── robots.ts               # robots.txt (uses owner.ts for siteUrl)
    ├── sitemap.ts              # sitemap.xml (uses owner.ts for siteUrl)
    │
    ├── _config/                # ← THE ONLY FOLDER YOU EDIT
    │   ├── owner.ts            # Identity, SEO, branding, versioning
    │   ├── portfolio.ts        # Portfolio content (windows + nav items)
    │   └── sections-library.ts # Ready-made section templates
    │
    ├── _constants/
    │   └── version.ts          # Reads NEXT_PUBLIC_OS_* build-time env vars
    │
    ├── _components/
    │   ├── CreditBar.tsx       # Fixed bottom credit bar (white → green after intro)
    │   └── WindowIcon.tsx      # Renders Bootstrap icon class OR /public image path
    │
    ├── (desktop)/
    │   ├── DesktopClient.tsx   # Phase machine: scroll → loading → login → desktop
    │   ├── _components/
    │   │   ├── IntroSequence.tsx    # 125-frame scroll-driven canvas animation
    │   │   ├── LoadingAnimation.tsx
    │   │   ├── LoginAnimation.tsx   # Boot log + credential-typing animation
    │   │   └── crt/
    │   │       ├── index.tsx        # CRTScreen shell (sizing + overscan clip)
    │   │       ├── crtCanvas.ts     # useCRTCanvas — owns the Three.js render loop
    │   │       ├── material.ts      # CRT ShaderMaterial (GLSL vert + frag)
    │   │       └── renderer.ts      # WebGLRenderer factory
    │   ├── _constants/
    │   │   └── crt.ts           # Color tokens, glitch helpers, layout metrics
    │   └── home/
    │       ├── canvas.ts        # All 2D drawing: windows, taskbar, hit-testing
    │       └── DesktopHome.tsx  # Wires canvas.ts to useCRTCanvas
    │
    ├── (mobile)/
    │   ├── MobileClient.tsx    # Phase machine: loading → boot → home
    │   ├── _components/
    │   │   ├── BootAnimation.tsx    # Splash screen with progress bar
    │   │   ├── BottomBar.tsx        # Bottom navigation bar
    │   │   ├── Clock.tsx            # Glitching clock widget with SVG seconds ring
    │   │   ├── LoadingAnimation.tsx
    │   │   ├── TopBar.tsx           # Status bar (OS name + version)
    │   │   └── WindowPage.tsx       # Renders a portfolio entry as mobile cards
    │   ├── _constants/
    │   │   └── ui.ts            # Timing, glow tokens, glitch stagger helpers
    │   └── home/
    │       └── MobileHome.tsx   # SPA view router + TeaserCard grid
    │
    ├── d/
    │   └── page.tsx            # Desktop entry point (lazy-loaded)
    └── m/
        └── page.tsx            # Mobile entry point (lazy-loaded)
```

---

## Architecture notes

### Desktop rendering pipeline

```
React state (phase)
  └─ DesktopHome
       └─ useCRTCanvas (hook in crtCanvas.ts)
            ├─ Offscreen 2D canvas  ←  canvas.ts draws all windows here every frame
            ├─ THREE.CanvasTexture   ←  uploaded to GPU each frame as a texture
            └─ CRT ShaderMaterial    →  rendered to the visible WebGL canvas
```

The 2D canvas and WebGL canvas are entirely separate elements. This lets all drawing code use the familiar Canvas 2D API while still getting the full CRT post-processing pass on every frame.

### Adaptive routing

The `middleware.ts` file runs at Vercel's edge network before any serverless function is invoked. It inspects the `User-Agent` header and rewrites the root path `/` to either `/d` (desktop) or `/m` (mobile). The URL the user sees stays as `/`. Both target pages are fully static and served from the CDN cache.

iPads are intentionally routed to desktop because iPadOS reports a desktop Safari user-agent.

### Session and state persistence

| Key in localStorage        | Content                        | TTL                                            |
| -------------------------- | ------------------------------ | ---------------------------------------------- |
| `{osName}-login-completed` | Timestamp (ms)                 | 10 minutes — boot animation skipped on revisit |
| `{osName}-desktop-state`   | Window positions + focus order | Permanent — restored on next visit             |

The storage key prefix is derived from `OWNER.osName`, so forks with different OS names never share each other's state.

### SEO for canvas-rendered content

The desktop experience renders entirely on `<canvas>`, which search engines cannot read. `layout.tsx` includes a visually-hidden `<footer>` that exposes all portfolio content as crawlable HTML. It is pixel-clipped and `aria-hidden` so it is invisible to users but fully readable by Google.

---

## Customising the theme

The CRT accent colour (`#00ff85`), background (`#0c0c0c`), font, and all derived RGBA variants live in:

```
src/app/(desktop)/_constants/crt.ts
```

Changing `ACCENT` and `BG` there will propagate to the desktop canvas. For the mobile side and global CSS utilities, update the matching values in `src/app/globals.css`.

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

## Features

| Feature                   | Description                                                                                                                                     |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **CRT shader**            | Full WebGL post-processing pass: barrel distortion, scanlines, chromatic aberration, vignette, flicker, and rounded-corner masking              |
| **Desktop OS simulation** | Draggable, closeable windows drawn on an offscreen 2D canvas, composited through the CRT material each frame                                    |
| **Intro sequence**        | 125-frame WebP image sequence played back on a `<canvas>` with scroll-driven autoplay and a hardware-accelerated fade                           |
| **Adaptive routing**      | Single root page detects viewport width and lazy-loads either the desktop or mobile experience; no JS is shipped for the unused branch          |
| **Auto-versioning**       | Build version is derived at compile time from the GitHub Compare API (commit count since a base SHA) and embedded as env vars                   |
| **Content-driven**        | All portfolio content lives in two files (`src/app/_config/owner.ts` and `src/app/_config/portfolio.ts`) — the only files you ever need to edit |

---

## Tech Stack

| Layer        | Technology                                                                      |
| ------------ | ------------------------------------------------------------------------------- |
| Framework    | [Next.js 15](https://nextjs.org/) (App Router)                                  |
| Language     | TypeScript 5                                                                    |
| 3D / Shaders | [Three.js](https://threejs.org/)                                                |
| Styling      | [Tailwind CSS v4](https://tailwindcss.com/)                                     |
| Icons        | [Bootstrap Icons](https://icons.getbootstrap.com/)                              |
| Font         | [VT323](https://fonts.google.com/specimen/VT323) (Google Fonts via `next/font`) |
| Deployment   | [Vercel](https://vercel.com/)                                                   |

---

## Project Structure

```
src/app/
├── _constants/
│   └── version.ts          # Reads NEXT_PUBLIC_* build-time env vars
├── _config/
│   ├── owner.ts            # ← Identity, SEO, branding, version
│   ├── portfolio.ts        # ← All portfolio content (windows, sections)
│   └── sections-library.ts # Ready-made section templates to copy from
├── (desktop)/
│   ├── DesktopClient.tsx   # Phase state machine: scroll → loading → login → desktop
│   ├── _components/
│   │   ├── IntroSequence.tsx   # 125-frame scroll-driven canvas animation
│   │   ├── LoadingAnimation.tsx
│   │   ├── LoginAnimation.tsx  # Boot log + credential-typing animation
│   │   └── crt/
│   │       ├── index.tsx       # CRTScreen layout shell (sizing + overscan clip)
│   │       ├── crtCanvas.ts    # useCRTCanvas hook — owns the Three.js render loop
│   │       ├── material.ts     # CRT ShaderMaterial (GLSL vert + frag)
│   │       └── renderer.ts     # WebGLRenderer factory
│   ├── _constants/
│   │   └── crt.ts          # Shared color tokens, glitch helpers, desktop layout metrics
│   └── home/
│       ├── canvas.ts       # All 2D drawing logic (windows, taskbar, hit-testing)
│       └── page.tsx        # Desktop component — wires canvas.ts to useCRTCanvas
├── (mobile)/
│   ├── MobileClient.tsx    # Phase state machine: loading → login → home
│   ├── _components/
│   │   ├── BootAnimation.tsx   # Splash screen with progress bar
│   │   ├── BottomBar.tsx       # Callback-driven bottom nav
│   │   ├── LoadingAnimation.tsx
│   │   ├── TopSection.tsx      # Status bar + animated clock widget
│   │   └── WindowPage.tsx      # Renders a WINDOWS entry as mobile cards
│   ├── _constants/
│   │   └── ui.ts           # Timing, glow tokens, glitch stagger helpers
│   └── home/
│       └── page.tsx        # MobileHome — SPA view router + TeaserCard grid
├── globals.css             # Tailwind v4 base, keyframes, cyber utility classes
├── layout.tsx              # Root layout — font loading, metadata
└── page.tsx                # Root page — viewport detection, lazy-loads correct client
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9 (`npm i -g pnpm`)

### Install & run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
pnpm build
pnpm start
```

---

## Environment Variables

Versioning is **fully optional** — the app shows `v0.0.0 / unknown` with no configuration at all.

### Option A — Manual version (recommended)

Open `src/app/_config/owner.ts` and set the `version` field:

```ts
version: "1.0.0",
```

That's it. The build ID is taken from the Git commit SHA automatically (Vercel sets `VERCEL_GIT_COMMIT_SHA`).

### Option B — Auto version from commit count

Set `version: ""` in `owner.ts` and add these to your Vercel **environment variables**:

| Variable                                   | Description                                                                                                 |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `PORTFOLIO_REPO_OWNER`                     | Your GitHub username                                                                                        |
| `PORTFOLIO_REPO_NAME`                      | Your repository name                                                                                        |
| `PORTFOLIO_BASE_SHA`                       | Commit SHA to treat as `v0.0.0` — every commit after it increments the version (e.g. 42 commits → `v0.4.2`) |
| `GITHUB_KEY` / `GITHUB_TOKEN` / `GH_TOKEN` | GitHub PAT with `repo` read scope — store as a **Vercel secret**                                            |

`VERCEL_GIT_COMMIT_SHA` is set automatically by Vercel.

### Internal variables (set by `next.config.ts` — do not set manually)

| Variable                  | Description                                 |
| ------------------------- | ------------------------------------------- |
| `NEXT_PUBLIC_OS_VERSION`  | Version string passed to the browser bundle |
| `NEXT_PUBLIC_OS_BUILD_ID` | Short Git SHA passed to the browser bundle  |

---

## Updating Portfolio Content

Everything is driven from **`src/app/_config/owner.ts`** (identity, SEO, version) and **`src/app/_config/portfolio.ts`** (windows, sections).  
No component files need to be touched for content changes.

```ts
// Add or edit a window entry:
{
  id: "projects",        // Unique ID — used for routing and state
  title: "PROJECTS.exe", // Titlebar text on desktop
  icon: "bi-folder2-open", // Bootstrap icon for mobile cards and nav
  sections: [
    {
      subtitle: "My Project",
      subtitleLink: "https://github.com/...", // Optional — makes subtitle a link
      body: ["Description line 1.", "Description line 2."],
      bodyLinks: [
        { lineIndex: 0, url: "https://..." }, // Makes body[0] a link
      ],
    },
  ],
}
```

To add a new window to the **mobile bottom nav** as well, add a matching entry to `MOBILE_NAV_ITEMS` in the same file.

---

## Architecture Notes

### Desktop rendering pipeline

```
React state (phase)
  └─ useCRTCanvas (hook)
       ├─ Offscreen 2D canvas  ←  canvas.ts draws here every frame
       ├─ THREE.CanvasTexture   ←  uploaded to GPU each frame
       └─ ShaderMaterial (CRT)  →  rendered to visible WebGL canvas
```

The 2D canvas and the WebGL canvas are separate elements. This lets the drawing code use the familiar Canvas 2D API while still getting the full CRT post-processing pass.

### Mobile navigation

The mobile experience is a **fully client-side SPA** — there are no sub-route pages. The `BottomNav` component only operates in callback mode; `MobileHome` owns all view state.

### Login skip / session persistence

Both desktop and mobile store a timestamp in `localStorage` when login completes.  
On the next visit, if the timestamp is within 10 minutes, the boot animation is skipped and the user lands directly on the home view.

---

## License

MIT
