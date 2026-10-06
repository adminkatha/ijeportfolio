import { Gallery } from "@/components/media/Gallery";
import { Mdx } from "@/components/mdx/Mdx";
import type { Project } from "@/content/data/schema";
import type { CaseStudy as CaseStudyDoc } from "@/lib/content";
import { ProjectFooter } from "../ProjectFooter";
import { ProjectHeader } from "../ProjectHeader";
import { ProjectSection } from "../ProjectSection";
import { VideoGrid } from "../VideoGrid";
import { numbered, type Block } from "./blocks";

/**
 * Video and Creative: a short brief (the header's summary, role and tools, plus the MDX if there is one),
 * the 9:16 video grid, then the gallery grouped by set.
 */
export function ShowcaseTemplate({ project: p, number, caseStudy }: { project: Project; number: number; caseStudy?: CaseStudyDoc }) {
  const blocks: Block[] = [
    caseStudy && {
      id: "brief",
      title: "Brief",
      labelAs: caseStudy.headings.length ? "p" : "h2",
      body: (
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-(--gutter)">
          <div className="lg:col-span-9 lg:col-start-4 xl:col-span-8 xl:col-start-4">
            {caseStudy.lede ? <p className="mb-8 max-w-[60ch] text-xl leading-relaxed text-text">{caseStudy.lede}</p> : null}
            <Mdx code={caseStudy.body} />
          </div>
        </div>
      ),
    },
    p.videos.length && {
      id: "videos",
      title: "Videos",
      note: `${p.videos.length} ${p.videos.length === 1 ? "video" : "videos"}`,
      body: <VideoGrid videos={p.videos} />,
    },
    p.gallery.length && {
      id: "gallery",
      title: "Gallery",
      note: `${p.gallery.length} ${p.gallery.length === 1 ? "image" : "images"}`,
      body: <Gallery images={p.gallery} headingLevel="h3" />,
    },
  ];
  const sections = numbered(blocks);
  return (
    <>
      <ProjectHeader project={p} number={number} />
      <div className="container-site">
        {sections.map((s) => (
          <ProjectSection key={s.id} id={s.id} number={s.number} title={s.title} note={s.note} labelAs={s.labelAs}>
            {s.body}
          </ProjectSection>
        ))}
      </div>
      <ProjectFooter project={p} sectionNumber={sections.length + 1} />
    </>
  );
}
