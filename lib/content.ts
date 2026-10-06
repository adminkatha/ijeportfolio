import { allPosts, allWorks } from "content-collections";
import { capabilities } from "@/content/data/capabilities";
import { experience } from "@/content/data/experience";
import { now } from "@/content/data/now";
import { playground } from "@/content/data/playground";
import { profile } from "@/content/data/profile";
import { projects } from "@/content/data/projects";
import { training } from "@/content/data/training";
import { caseStudySections, disciplineLabels, isFillIn, type Discipline, type Project } from "@/content/data/schema";

/*
 * The only way components read content. Everything here runs at build time (all routes are static),
 * so a broken case study fails `pnpm build`.
 *
 * Unanswered questions (fillIn("…") in content/data, <FillIn> in the MDX) stay in the source, where
 * `pnpm fill-ins` lists them for docs/INTAKE.md, but never reach the page: the accessors below drop them, and a
 * field, list, section or nav link with nothing real left in it is simply not shown.
 */

type WorkDoc = (typeof allWorks)[number];
/** A case study as the site shows it. `short`: most sections are still unanswered, so the page shows the rest as a short "About the project" instead of a full case study. */
export type CaseStudy = WorkDoc & { short: boolean };
export type Post = (typeof allPosts)[number];

/** The value, or undefined when it's a fillIn("…") placeholder. */
const real = <T extends string | null | undefined>(value: T) => (typeof value === "string" && isFillIn(value) ? undefined : value);

// ── Case-study check (PLAN §4): the source keeps every required H2 per discipline, in order ────────

const caseStudies = new Map<string, CaseStudy>();
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
    const doc = allWorks.find((d) => d.slug === p.slug);
    if (!doc) {
      problems.push(`content/work/${p.slug}.mdx is missing (required for ${disciplineLabels[p.discipline]} work)`);
      continue;
    }
    const found = doc.sourceHeadings.map((h) => h.text);
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

  for (const doc of allWorks) {
    const project = projects.find((p) => p.slug === doc.slug);
    const required = project ? caseStudySections[project.discipline] : undefined;
    const short = required ? doc.headings.length < required.length / 2 : false;
    if (doc.headings.length || doc.lede) caseStudies.set(doc.slug, { ...doc, short });
  }
}

// ── What the site shows (placeholders removed) ────────────────────────────────

const visibleProject = (p: Project): Project => ({
  ...p,
  role: real(p.role) ?? "",
  stack: p.stack.filter((tool) => !isFillIn(tool)),
  liveUrl: real(p.liveUrl),
});

const byOrder = [...projects].sort((a, b) => a.order - b.order).map(visibleProject);

const visibleProfile = {
  ...profile,
  bio: profile.bio.filter((line) => !isFillIn(line)),
  location: real(profile.location) ?? "",
  links: {
    ...profile.links,
    github: real(profile.links.github),
    linkedin: real(profile.links.linkedin),
    resume: real(profile.links.resume),
  },
};

const visibleExperience = experience.map((role) => ({
  ...role,
  start: real(role.start),
  end: role.end === null ? null : real(role.end),
  bullets: role.bullets.filter((b) => !isFillIn(b)),
  tech: role.tech.filter((t) => !isFillIn(t)),
}));

const visibleNow = {
  building: now.building.filter((b) => !isFillIn(b.name)).map((b) => ({ ...b, description: real(b.description) ?? "" })),
  learning: now.learning.filter((l) => !isFillIn(l)),
  updatedAt: real(now.updatedAt),
};

// ── Accessors ────────────────────────────────────────────────────────────────

export const getProfile = () => visibleProfile;
export const getProjects = (): Project[] => byOrder;
export const getFeaturedProjects = (): Project[] => byOrder.filter((p) => p.featured).slice(0, 4);
export const getProject = (slug: string): Project | undefined => byOrder.find((p) => p.slug === slug);
/** The case study as shown (empty sections removed); undefined when nothing real is left in it. */
export const getCaseStudy = (slug: string): CaseStudy | undefined => caseStudies.get(slug);
export const getExperience = () => visibleExperience;
export const getTraining = () => training;
export const getCapabilities = () => capabilities;
export const getNow = () => visibleNow;
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

/** Whether the optional sections and routes exist (hidden, with their nav links and sitemap entries, while empty). */
export const hasPlayground = () => playground.length > 0;
export const hasWriting = () => allPosts.length > 0;
export const hasNow = () => visibleNow.building.length + visibleNow.learning.length > 0;

export function getHomeSections(): HomeSection[] {
  const all: { id: HomeSectionId; title: string; visible: boolean }[] = [
    { id: "work", title: "Selected work", visible: getFeaturedProjects().length > 0 },
    { id: "capabilities", title: "Capabilities", visible: capabilities.length > 0 },
    { id: "experience", title: "Experience", visible: visibleExperience.length > 0 },
    { id: "now", title: "Now", visible: hasNow() },
    { id: "playground", title: "Playground", visible: hasPlayground() },
    { id: "writing", title: "Writing", visible: hasWriting() },
    { id: "contact", title: "Contact", visible: true },
  ];
  return all
    .filter((s) => s.visible)
    .map((s, i) => ({ id: s.id, title: s.title, number: i + 1, href: `/#${s.id}` as const }));
}
