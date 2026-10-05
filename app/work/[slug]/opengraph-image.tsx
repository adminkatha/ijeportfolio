import { notFound } from "next/navigation";
import { disciplineLabels, isFillIn } from "@/content/data/schema";
import { getProfile, getProject, getProjects } from "@/lib/content";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

// One share image per case study at /work/<slug>/opengraph-image, all generated at build time (unknown slugs 404).
// pageMetadata() (lib/seo.ts) points each case study at its image with a project-specific alt text.
export const dynamicParams = false;

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}

export const alt = `Case study by ${getProfile().name}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const project = getProject((await params).slug);
  if (!project) notFound();
  const profile = getProfile();
  const label = [disciplineLabels[project.discipline], project.year ? String(project.year) : null].filter(Boolean).join(" · ");
  return renderOgCard({
    index: project.order,
    label,
    title: project.title,
    subtitle: isFillIn(project.eyebrow) ? undefined : project.eyebrow,
    footer: `${profile.name} · ${project.isSample ? "Sample campaign" : "Case study"}`,
    sample: project.isSample,
  });
}
