import type { MetadataRoute } from "next";
import { OWNER } from "./_config/owner";

// Tells search engine crawlers they are welcome to index everything.
// Next.js serves this as /robots.txt automatically.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${OWNER.siteUrl}/sitemap.xml`,
  };
}
