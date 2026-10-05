// STUB (owned by the SEO agent; replaced in phase 10). Keep these export names.
import type { Project } from "@/content/data/schema";

export function personJsonLd(): Record<string, unknown> {
  return { "@context": "https://schema.org", "@type": "Person" };
}

export function projectJsonLd(project: Project): Record<string, unknown> {
  return { "@context": "https://schema.org", "@type": "CreativeWork", name: project.title };
}
