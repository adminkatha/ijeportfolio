import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { disciplineLabels } from "@/content/data/schema";
import { getProjects } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Work",
  description: "Every project: websites and systems, Meta campaigns, short-form video and ad creative.",
  path: "/work",
});

// Phase 3: a plain index so the nav target exists. The filtered index + cards arrive in phase 9.
export default function WorkPage() {
  const projects = getProjects();
  return (
    <main id="main">
      <PageHeader label="Index" title="Work" />
      <div className="container-site py-16">
        <ol className="divide-y divide-line border-y border-line">
          {projects.map((p) => (
            <li key={p.slug} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4">
              <Link href={`/work/${p.slug}`} className="link-quiet type-title text-2xl">
                {p.title}
              </Link>
              <span className="label-mono text-text-2">{disciplineLabels[p.discipline]}</span>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
