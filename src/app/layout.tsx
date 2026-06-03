import type { Metadata } from "next";
import { VT323 } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import CreditBar from "./_components/CreditBar";
import { WINDOWS } from "./_config/portfolio";
import { OWNER } from "./_config/owner";

const vt323 = VT323({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-body",
  display: "swap",
});

// ─── Person schema (JSON-LD) ──────────────────────────────────────────────────
// Tells Google this website belongs to a specific real person, which is the
// most important signal for ranking on personal-name searches.
const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: OWNER.name,
  alternateName: OWNER.displayName,
  url: OWNER.siteUrl,
  jobTitle: OWNER.jobTitle,
  sameAs: [
    OWNER.github,
    OWNER.linkedin,
  ],
};

export const metadata: Metadata = {
  // Both spellings in the title help Google associate them with one entity.
  title: OWNER.seoTitle,
  description: OWNER.seoDescription,
  metadataBase: new URL(OWNER.siteUrl),
  // Open Graph — controls how the link looks when shared on Slack, Discord, etc.
  openGraph: {
    type: "website",
    url: OWNER.siteUrl,
    title: OWNER.seoTitle,
    description: OWNER.seoDescription,
    siteName: `${OWNER.displayName}'s Portfolio`,
    images: OWNER.socialImage
      ? [{ url: `${OWNER.siteUrl}${OWNER.socialImage}`, width: 1200, height: 630 }]
      : undefined,
  },
  twitter: {
    card: "summary_large_image",
    title: OWNER.seoTitle,
    description: OWNER.seoDescription,
    images: OWNER.socialImage ? [`${OWNER.siteUrl}${OWNER.socialImage}`] : undefined,
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png" },
    other: [
      { rel: "android-chrome-192", url: "/android-chrome-192x192.png" },
      { rel: "android-chrome-512", url: "/android-chrome-512x512.png" },
    ],
  },
  // manifest is served dynamically from src/app/manifest.ts — no static file needed
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={OWNER.lang}>
      <head>
        {/* Person schema — signals to Google that this site belongs to a specific person */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
      </head>
      <body className={vt323.variable}>
        {children}

        <CreditBar />

        {/*
          Visually hidden semantic content for search engine crawlers.
          The desktop experience renders entirely on a <canvas>, which Google
          cannot read. This section exposes the same content as crawlable HTML
          so the portfolio work and contact info get indexed.
        */}
        <footer
          aria-hidden="true"
          style={{
            position: "absolute",
            width: "1px",
            height: "1px",
            padding: 0,
            margin: "-1px",
            overflow: "hidden",
            clip: "rect(0,0,0,0)",
            whiteSpace: "nowrap",
            border: 0,
          }}
        >
          <h1>{OWNER.displayName}</h1>
          <p>{OWNER.bio}</p>
          {WINDOWS.map((win) => (
            <section key={win.id}>
              <h2>{win.title}</h2>
              {win.sections.map((sec) => (
                <div key={sec.subtitle}>
                  {sec.subtitleLink ? (
                    <h3>
                      <a href={sec.subtitleLink} rel="noopener noreferrer">
                        {sec.subtitle}
                      </a>
                    </h3>
                  ) : (
                    <h3>{sec.subtitle}</h3>
                  )}
                  {sec.body.map((line, i) => {
                    const link = sec.bodyLinks?.find((bl) => bl.lineIndex === i);
                    return link ? (
                      <p key={i}>
                        <a href={link.url} rel="noopener noreferrer">{line}</a>
                      </p>
                    ) : (
                      <p key={i}>{line}</p>
                    );
                  })}
                </div>
              ))}
            </section>
          ))}
          <p>
            Contact: <a href={`mailto:${OWNER.email}`}>{OWNER.email}</a>
            {" | "}
            <a href={OWNER.linkedin}>LinkedIn</a>
            {" | "}
            <a href={OWNER.github}>GitHub</a>
          </p>
        </footer>
        {/* Tracks page views, visitors, referrers, countries, browsers, devices */}
        <Analytics />
        {/* Tracks Core Web Vitals: LCP, CLS, FCP, TTFB, INP */}
        <SpeedInsights />
        {/* Google Analytics — loads after all resources so it never affects LCP/FCP */}
        {OWNER.gaId ? <GoogleAnalytics gaId={OWNER.gaId} /> : null}
      </body>
    </html>
  );
}
