import type { MetadataRoute } from "next";
import { OWNER } from "./_config/owner";

// Next.js serves this as /sitemap.xml automatically.
// Submit it at Google Search Console so Google discovers and indexes the site faster:
// → {your site URL}/sitemap.xml
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: OWNER.siteUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
