import { DemoFrame } from "@/components/media/DemoFrame";
import { Gallery } from "@/components/media/Gallery";
import type { Project } from "@/content/data/schema";
import type { CaseStudy as CaseStudyDoc } from "@/lib/content";
import { CaseStudy } from "../CaseStudy";
import { ProjectFooter } from "../ProjectFooter";
import { ProjectHeader } from "../ProjectHeader";
import { ProjectSection } from "../ProjectSection";
import { VideoGrid } from "../VideoGrid";
import { numbered, type Block } from "./blocks";

/** Web & Systems: header + meta, live demos, screen recordings, gallery, then the case study with its index. */
export function WebSystemsTemplate({ project: p, number, caseStudy }: { project: Project; number: number; caseStudy?: CaseStudyDoc }) {
  const blocks: Block[] = [
    p.demos.length && {
      id: "live-demos",
      title: "Live demos",
      note: "Sample data",
      body: (
        <div className="space-y-16">
          {p.demos.map((d) => (
            <DemoFrame key={d.slug} demo={d} />
          ))}
        </div>
      ),
    },
    p.videos.length && { id: "screen-recordings", title: "Screen recordings", body: <VideoGrid videos={p.videos} /> },
    p.gallery.length && { id: "gallery", title: "Gallery", body: <Gallery images={p.gallery} headingLevel="h3" /> },
    caseStudy && {
      id: caseStudy.short ? "about" : "case-study",
      title: caseStudy.short ? "About the project" : "Case study",
      labelAs: "p",
      body: <CaseStudy caseStudy={caseStudy} />,
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
