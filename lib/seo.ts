import type { Metadata } from "next";
import { disciplineLabels, isFillIn } from "@/content/data/schema";
import { getProfile, getProject } from "@/lib/content";
import { siteUrl } from "@/lib/site";

/*
 * Metadata for every route (PLAN §8, phase 10). URLs are relative and resolve against `metadataBase`
 * (SITE_URL → the Vercel production domain → http://localhost:3000, see lib/site.ts).
 *
 * Share images (1200×630, generated at build time): app/opengraph-image.tsx for the homepage and every page
 * without its own, app/work/[slug]/opengraph-image.tsx and app/now/opengraph-image.tsx.
 */

const profile = getProfile();
const firstName = profile.name.split(" ")[0];

export const SITE_NAME = profile.name;
const defaultTitle = `${profile.name}, ${profile.title}`;
const defaultDescription = isFillIn(profile.positioning) ? profile.roleLine : profile.positioning;
const siteImageAlt = `${profile.name}, ${profile.title}: ${profile.roleLine}`;

/** Root-layout metadata: metadataBase, title template, default description, Open Graph/Twitter defaults, icons (app/icon.svg). */
export const rootMetadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: defaultTitle, template: `%s · ${profile.name}` },
  description: defaultDescription,
  applicationName: profile.name,
  authors: [{ name: profile.name, url: siteUrl.href }],
  creator: profile.name,
  // The homepage's canonical. Every other page sets its own through pageMetadata().
  alternates: { canonical: "/" },
  // The image comes from app/opengraph-image.tsx (Next adds it here, with its size and alt text).
  openGraph: {
    type: "website",
    siteName: profile.name,
    url: "/",
    title: defaultTitle,
    description: defaultDescription,
  },
  twitter: { card: "summary_large_image", title: defaultTitle, description: defaultDescription },
  formatDetection: { telephone: false, email: false, address: false },
};

export type PageMetadataInput = {
  title: string;
  description: string;
  /** Path on this site, e.g. "/work/sabbath-spa". Becomes the canonical URL and og:url. */
  path: string;
  noindex?: boolean;
  /** og:type. Default "website"; "article" suits a case study. */
  type?: "website" | "article";
  /** Use `title` as the whole <title> (no " · Ehjay Lorenzo" suffix), e.g. for the homepage. */
  absoluteTitle?: boolean;
};

/** The share image for a path: its own generated card when it has one, otherwise the site-wide card. */
function shareImage(path: string) {
  const image = { width: 1200, height: 630, type: "image/png" };
  const slug = /^\/work\/([a-z0-9-]+)\/?$/.exec(path)?.[1];
  const project = slug ? getProject(slug) : undefined;
  if (project) {
    const kind = project.isSample ? "Sample campaign" : `${disciplineLabels[project.discipline]} case study`;
    return { ...image, url: `/work/${project.slug}/opengraph-image`, alt: `${project.title}: ${kind} by ${profile.name}` };
  }
  if (/^\/now\/?$/.test(path)) return { ...image, url: "/now/opengraph-image", alt: `Now: what ${firstName} is building and learning` };
  return { ...image, url: "/opengraph-image", alt: siteImageAlt };
}

/** Per-route metadata: title, description, canonical, Open Graph and Twitter (summary_large_image). */
export function pageMetadata({ title, description, path, noindex, type = "website", absoluteTitle }: PageMetadataInput): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} · ${profile.name}`;
  const images = [shareImage(path)];
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { type, siteName: profile.name, url: path, title: fullTitle, description, images },
    twitter: { card: "summary_large_image", title: fullTitle, description, images },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
