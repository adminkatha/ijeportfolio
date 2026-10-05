import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

// Everything may be crawled. The /demos pages keep themselves out of search results with their own
// noindex meta tag and X-Robots-Tag header (next.config.ts); disallowing them here would hide those signals.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
