import { disciplineLabels, isFillIn } from "@/content/data/schema";
import { getCapabilities, getProfile, getProjects } from "@/lib/content";
import { absoluteUrl } from "@/lib/site";

// /llms.txt (llmstxt.org): a plain-text summary of who Ehjay is and his work, for AI assistants.
// Static (built once). Sample campaigns are labelled; unanswered [FILL IN] values are skipped.
export const dynamic = "force-static";

const real = (value: string | undefined): value is string => !!value && !isFillIn(value);

export function GET() {
  const profile = getProfile();
  const firstName = profile.name.split(" ")[0];
  const lines: string[] = [];

  lines.push(`# ${profile.name}`, "");
  lines.push(`> ${profile.title}. ${profile.roleLine}`, "");
  if (real(profile.positioning)) lines.push(profile.positioning, "");
  for (const paragraph of profile.bio.filter(real)) lines.push(paragraph, "");
  if (real(profile.location)) lines.push(`Based in ${profile.location}.`, "");

  lines.push("## Work", "");
  for (const p of getProjects()) {
    const tags = [disciplineLabels[p.discipline], p.isSample ? "Sample campaign" : null, p.year ? String(p.year) : null].filter(Boolean);
    lines.push(`- [${p.title}](${absoluteUrl(`/work/${p.slug}`)}): ${tags.join(", ")}. ${p.summary}`);
  }
  lines.push("");

  lines.push("## Capabilities", "");
  for (const group of getCapabilities()) {
    for (const item of group.items.filter((i) => real(i.name) && real(i.evidence))) {
      lines.push(`- ${group.group}: ${item.name}. ${item.evidence}`);
    }
  }
  lines.push("");

  lines.push("## Contact", "");
  lines.push(`- Email: ${profile.email}`);
  lines.push(`- [Contact form](${absoluteUrl("/#contact")})`);
  const links: [string, string | undefined][] = [
    ["LinkedIn", profile.links.linkedin],
    ["GitHub", profile.links.github],
    ...profile.links.other.map((l): [string, string] => [l.label, l.href]),
  ];
  for (const [label, href] of links) if (real(href)) lines.push(`- [${label}](${href})`);
  lines.push("");

  lines.push("## Pages", "");
  lines.push(`- [Home](${absoluteUrl("/")}): selected work, capabilities, experience and contact`);
  lines.push(`- [All work](${absoluteUrl("/work")}): every project, filterable by discipline`);
  lines.push(`- [Now](${absoluteUrl("/now")}): what ${firstName} is working on now`);
  lines.push("");

  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
