// STUB (owned by the SEO agent; replaced in phase 10). Keep these export names and the input type.
import type { Metadata } from "next";
import { profile } from "@/content/data/profile";
import { siteUrl } from "@/lib/site";

/** Root-layout metadata: metadataBase, title template, default description, Open Graph/Twitter defaults, icons. */
export const rootMetadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: `${profile.name}, ${profile.title}`, template: `%s · ${profile.name}` },
  description: profile.positioning,
};

export type PageMetadataInput = {
  title: string;
  description: string;
  /** Path on this site, e.g. "/work/sabbath-spa". Becomes the canonical URL. */
  path: string;
  noindex?: boolean;
};

/** Per-route metadata: title, description, canonical, Open Graph and Twitter. */
export function pageMetadata({ title, description, path, noindex }: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
