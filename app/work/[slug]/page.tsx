import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { CampaignTemplate } from "@/components/work/templates/Campaign";
import { ShowcaseTemplate } from "@/components/work/templates/Showcase";
import { WebSystemsTemplate } from "@/components/work/templates/WebSystems";
import { getCaseStudy, getProject, getProjects } from "@/lib/content";
import { projectJsonLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

/** Every project is generated at build time; any other slug is a 404. */
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

/** One page per project; the primary discipline picks the template. */
export default async function ProjectPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  const number = getProjects().findIndex((p) => p.slug === slug) + 1;
  const caseStudy = getCaseStudy(slug);
  const Template =
    project.discipline === "web-systems" ? WebSystemsTemplate : project.discipline === "campaigns" ? CampaignTemplate : ShowcaseTemplate;
  return (
    <main id="main">
      <JsonLd data={projectJsonLd(project)} />
      <Template project={project} number={number} caseStudy={caseStudy} />
    </main>
  );
}
