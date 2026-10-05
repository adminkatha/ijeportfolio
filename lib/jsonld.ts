import { existsSync } from "node:fs";
import { join } from "node:path";
import { disciplineLabels, isFillIn, type Project } from "@/content/data/schema";
import { getProfile } from "@/lib/content";
import { absoluteUrl } from "@/lib/site";

/*
 * Structured data (schema.org JSON-LD), rendered with <JsonLd data={…} /> from components/seo/JsonLd.tsx.
 * Only real facts: [FILL IN] values and links that aren't real URLs are left out, and an image is referenced
 * only if the file exists in /public.
 */

const PERSON_ID = absoluteUrl("/#person");

const isRealUrl = (value: string | undefined): value is string => !!value && !isFillIn(value) && /^https?:\/\//.test(value);
const publicFileExists = (src: string) => existsSync(join(process.cwd(), "public", src));

/** The person behind the site. Put it on the homepage. */
export function personJsonLd(): Record<string, unknown> {
  const profile = getProfile();
  const sameAs = [profile.links.github, profile.links.linkedin, ...profile.links.other.map((l) => l.href)].filter(isRealUrl);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": PERSON_ID,
    name: profile.name,
    jobTitle: profile.title,
    ...(isFillIn(profile.positioning) ? {} : { description: profile.positioning }),
    email: `mailto:${profile.email}`,
    url: absoluteUrl("/"),
    ...(publicFileExists(profile.photo.src) ? { image: absoluteUrl(profile.photo.src) } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

/** The site itself (name + URL), for the homepage alongside personJsonLd(). */
export function websiteJsonLd(): Record<string, unknown> {
  const profile = getProfile();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: profile.name,
    url: absoluteUrl("/"),
    author: { "@id": PERSON_ID },
  };
}

/** One piece of work, for its /work/<slug> page. Sample campaigns say so in the description. */
export function projectJsonLd(project: Project): Record<string, unknown> {
  const profile = getProfile();
  const url = absoluteUrl(`/work/${project.slug}`);
  const image = [project.cover?.src, project.gallery[0]?.src, project.videos[0]?.poster].find(
    (src): src is string => !!src && publicFileExists(src),
  );
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${url}#work`,
    name: project.title,
    description: project.isSample ? `Sample campaign. ${project.summary}` : project.summary,
    url,
    genre: disciplineLabels[project.discipline],
    creator: { "@type": "Person", "@id": PERSON_ID, name: profile.name, url: absoluteUrl("/") },
    ...(image ? { image: absoluteUrl(image) } : {}),
    ...(project.year ? { dateCreated: String(project.year) } : {}),
  };
}
