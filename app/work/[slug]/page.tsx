import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { disciplineLabels } from "@/content/data/schema";
import { getProject, getProjects } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  return pageMetadata({ title: project.title, description: project.summary, path: `/work/${project.slug}` });
}

// Phase 3: a plain page so links resolve. The three discipline templates arrive in phase 9.
export default async function ProjectPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  return (
    <main id="main">
      <PageHeader label={disciplineLabels[project.discipline]} title={project.title}>
        <p>{project.summary}</p>
      </PageHeader>
    </main>
  );
}
