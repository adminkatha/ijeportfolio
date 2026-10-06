import type { MetadataRoute } from "next";
import { getProjects, hasNow, hasPlayground, hasWriting } from "@/lib/content";
import { absoluteUrl } from "@/lib/site";

// Built at build time. /now, /writing and /playground appear only when they have content; /demos/* never do
// (the live dashboard demos are noindex). No lastModified: there are no real per-page dates to report.
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/work",
    ...getProjects().map((p) => `/work/${p.slug}`),
    ...(hasNow() ? ["/now"] : []),
    ...(hasWriting() ? ["/writing"] : []),
    ...(hasPlayground() ? ["/playground"] : []),
  ];
  return paths.map((path) => ({ url: absoluteUrl(path) }));
}
