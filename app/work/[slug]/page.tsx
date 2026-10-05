import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { DemoFrame } from "@/components/media/DemoFrame";
import { Gallery } from "@/components/media/Gallery";
import { VideoPlayer } from "@/components/media/VideoPlayer";
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

// Phase 8: the project's media (demos, videos, gallery). The three discipline templates arrive in phase 9.
export default async function ProjectPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  return (
    <main id="main">
      <PageHeader label={disciplineLabels[project.discipline]} title={project.title}>
        <p>{project.summary}</p>
      </PageHeader>
      <div className="container-site space-y-20 py-16">
        {project.demos.length ? (
          <section aria-labelledby="demos" className="space-y-10">
            <h2 id="demos" className="label-mono text-text-2">
              Live demos
            </h2>
            {project.demos.map((d) => (
              <DemoFrame key={d.slug} demo={d} />
            ))}
          </section>
        ) : null}
        {project.videos.length ? (
          <section aria-labelledby="videos" className="space-y-10">
            <h2 id="videos" className="label-mono text-text-2">
              Video
            </h2>
            <ul className="grid gap-x-(--gutter) gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {project.videos.map((v) => (
                <li key={v.src + v.title}>
                  <VideoPlayer video={v} sizes="(min-width: 1328px) 411px, (min-width: 1024px) 31vw, (min-width: 640px) 47vw, calc(100vw - 32px)" />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {project.gallery.length ? (
          <section aria-labelledby="gallery" className="space-y-10">
            <h2 id="gallery" className="label-mono text-text-2">
              Gallery
            </h2>
            <Gallery images={project.gallery} />
          </section>
        ) : null}
      </div>
    </main>
  );
}
