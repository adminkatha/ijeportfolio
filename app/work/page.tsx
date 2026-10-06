import { PageHeader } from "@/components/layout/PageHeader";
import { ProjectRow } from "@/components/work/ProjectRow";
import { WorkFilter, type FilterOption } from "@/components/work/WorkFilter";
import { disciplineLabels, disciplines } from "@/content/data/schema";
import { disciplinesOf, getProjects } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Work",
  description: "Every project by Ehjay Lorenzo: websites and systems, Meta campaigns, short-form video and ad creative.",
  path: "/work",
});

/**
 * /work: the full index with a discipline filter. Statically generated: the server never reads
 * searchParams; the filter (a client island) and a boot script in the root layout apply ?d= in the browser.
 */
export default function WorkPage() {
  const projects = getProjects();
  const options: FilterOption[] = [
    { id: "all", label: "All", count: projects.length },
    ...disciplines
      .map((d) => ({ id: d, label: disciplineLabels[d], count: projects.filter((p) => disciplinesOf(p).includes(d)).length }))
      .filter((o) => o.count > 0),
  ];
  const labels = options.slice(1).map((o) => o.label);
  const listed = labels.length > 1 ? `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}` : (labels[0] ?? "");
  return (
    <main id="main">
      <PageHeader label="Index" aside={<span>{projects.length} projects</span>} title="Work">
        <p>{listed}.</p>
      </PageHeader>
      <div className="container-site pt-10 pb-20 md:pt-12 md:pb-28">
        <WorkFilter options={options} />
        <ol className="mt-10 border-t border-line md:mt-12">
          {projects.map((p, i) => (
            <ProjectRow key={p.slug} project={p} number={i + 1} />
          ))}
        </ol>
      </div>
    </main>
  );
}
