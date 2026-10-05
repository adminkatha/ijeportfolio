// STUB (owned by the SEO agent; replaced in phase 10). Keep this export name and input type.
import type { Metadata } from "next";

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
