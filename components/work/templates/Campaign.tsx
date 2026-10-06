import { Gallery } from "@/components/media/Gallery";
import type { Project } from "@/content/data/schema";
import type { CaseStudy as CaseStudyDoc } from "@/lib/content";
import { CaseStudy } from "../CaseStudy";
import { ProjectFooter } from "../ProjectFooter";
import { ProjectHeader } from "../ProjectHeader";
import { ProjectSection } from "../ProjectSection";
import { VideoGrid } from "../VideoGrid";
import { numbered, type Block } from "./blocks";

/** Campaigns: header + meta (Sample campaign tag when it is one), the case study, then the creative. */
export function CampaignTemplate({ project: p, number, caseStudy }: { project: Project; number: number; caseStudy?: CaseStudyDoc }) {
  const blocks: Block[] = [
    caseStudy && { id: "case-study", title: "Case study", labelAs: "p", body: <CaseStudy caseStudy={caseStudy} /> },
    p.gallery.length && { id: "gallery", title: "The creative", body: <Gallery images={p.gallery} headingLevel="h3" /> },
    p.videos.length && { id: "video", title: "Video", body: <VideoGrid videos={p.videos} /> },
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
