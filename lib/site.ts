/**
 * The canonical site origin. SITE_URL wins; on Vercel it falls back to the production domain Vercel
 * provides (VERCEL_PROJECT_PRODUCTION_URL, no protocol); locally it is http://localhost:3000.
 */
export function getSiteUrl(): URL {
  const explicit = process.env.SITE_URL?.trim();
  if (explicit) return new URL(explicit);
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return new URL(`https://${vercel}`);
  return new URL("http://localhost:3000");
}

export const siteUrl = getSiteUrl();

/** Absolute URL for a path on this site, e.g. absoluteUrl("/work") → "https://…/work". */
export const absoluteUrl = (path = "/") => new URL(path, siteUrl).toString();
