import { allPosts, allWorks } from "content-collections";
import { capabilities } from "@/content/data/capabilities";
import { experience } from "@/content/data/experience";
import { now } from "@/content/data/now";
import { playground } from "@/content/data/playground";
import { profile } from "@/content/data/profile";
import { projects } from "@/content/data/projects";
import { caseStudySections, disciplineLabels, type Discipline, type Project } from "@/content/data/schema";

/*
 * The only way components read content. Everything here runs at build time (all routes are static),
 * so a broken case study fails `pnpm build`.
 */

export type CaseStudy = (typeof allWorks)[number];
export type Post = (typeof allPosts)[number];

// ── Case-study check (PLAN §4): required H2s per discipline, in order ───────────

const caseStudies = new Map(allWorks.map((doc) => [doc.slug, doc]));
{
  const problems: string[] = [];
  for (const doc of allWorks) {
    if (!projects.some((p) => p.slug === doc.slug)) {
      problems.push(`content/work/${doc.slug}.mdx has no project with that slug in content/data/projects.ts`);
    }
  }
  for (const p of projects) {
    const required = caseStudySections[p.discipline];
    if (!required) continue;
    const doc = caseStudies.get(p.slug);
    if (!doc) {
      problems.push(`content/work/${p.slug}.mdx is missing (required for ${disciplineLabels[p.discipline]} work)`);
      continue;
    }
    const found = doc.headings.map((h) => h.text);
    const missing = required.filter((h) => !found.includes(h));
    if (missing.length) {
      problems.push(`content/work/${p.slug}.mdx is missing the section(s): ${missing.map((h) => `"## ${h}"`).join(", ")}`);
    } else {
      const order = found.filter((h) => required.includes(h));
      if (order.join("|") !== required.join("|")) {
        problems.push(`content/work/${p.slug}.mdx has its sections out of order; expected: ${required.join(" → ")}`);
      }
    }
  }
  if (problems.length) throw new Error(`\n✗ Case studies:\n${problems.map((p) => `  - ${p}`).join("\n")}\n`);
}

// ── Accessors ────────────────────────────────────────────────────────────────

const byOrder = [...projects].sort((a, b) => a.order - b.order);

export const getProfile = () => profile;
export const getProjects = (): Project[] => byOrder;
export const getFeaturedProjects = (): Project[] => byOrder.filter((p) => p.featured).slice(0, 4);
export const getProject = (slug: string): Project | undefined => byOrder.find((p) => p.slug === slug);
export const getCaseStudy = (slug: string): CaseStudy | undefined => caseStudies.get(slug);
export const getExperience = () => experience;
export const getCapabilities = () => capabilities;
export const getNow = () => now;
export const getPlayground = () => playground;
export const getPosts = (): Post[] => [...allPosts].sort((a, b) => b.date.localeCompare(a.date));

/** All disciplines a project appears under (primary first). */
export const disciplinesOf = (p: Project): Discipline[] => [p.discipline, ...p.alsoIn];

/** Previous/next project in list order, wrapping around. */
export function getNeighbors(slug: string): { prev: Project; next: Project } | undefined {
  const i = byOrder.findIndex((p) => p.slug === slug);
  if (i === -1 || byOrder.length < 2) return undefined;
  return {
    prev: byOrder[(i - 1 + byOrder.length) % byOrder.length]!,
    next: byOrder[(i + 1) % byOrder.length]!,
  };
}

// ── Homepage sections (PLAN §1): numbered from the visible ones, so there are no gaps ─────────

export type HomeSectionId = "work" | "capabilities" | "experience" | "now" | "playground" | "writing" | "contact";
export type HomeSection = { id: HomeSectionId; title: string; number: number; href: `/#${HomeSectionId}` };

export function getHomeSections(): HomeSection[] {
  const all: { id: HomeSectionId; title: string; visible: boolean }[] = [
    { id: "work", title: "Selected work", visible: getFeaturedProjects().length > 0 },
    { id: "capabilities", title: "Capabilities", visible: capabilities.length > 0 },
    { id: "experience", title: "Experience", visible: experience.length > 0 },
    { id: "now", title: "Now", visible: true },
    { id: "playground", title: "Playground", visible: playground.length > 0 },
    { id: "writing", title: "Writing", visible: allPosts.length > 0 },
    { id: "contact", title: "Contact", visible: true },
  ];
  return all
    .filter((s) => s.visible)
    .map((s, i) => ({ id: s.id, title: s.title, number: i + 1, href: `/#${s.id}` as const }));
}

/** Whether the optional routes exist (they render notFound() and leave nav and sitemap while empty). */
export const hasPlayground = () => playground.length > 0;
export const hasWriting = () => allPosts.length > 0;
