import { disciplineLabels, isFillIn } from "@/content/data/schema";
import { getCapabilities, getExperience, getProfile, getProjects, getTraining, hasNow } from "@/lib/content";
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

  lines.push("## Work", "");
  for (const p of getProjects()) {
    const tags = [disciplineLabels[p.discipline], p.isSample ? "Sample campaign" : null, p.year ? String(p.year) : null].filter(Boolean);
    lines.push(`- [${p.title}](${absoluteUrl(`/work/${p.slug}`)}): ${tags.join(", ")}. ${p.summary}`);
  }
  lines.push("");

  lines.push("## Capabilities", "");
  for (const group of getCapabilities()) {
    for (const item of group.items.filter((i) => real(i.name))) {
      lines.push(`- ${group.group}: ${item.name}${real(item.evidence) ? `. ${item.evidence}` : ""}`);
    }
    if (group.tools.length) lines.push(`- ${group.group} tools: ${group.tools.join(", ")}`);
  }
  lines.push("");

  lines.push("## Experience", "");
  for (const role of getExperience()) {
    const dates = role.start ? (role.end === role.start ? role.start : `${role.start}–${role.end === null ? "present" : (role.end ?? "")}`) : "";
    lines.push(`- ${role.role}, ${role.company}${dates ? ` (${dates})` : ""}${role.bullets.length ? `: ${role.bullets.join(" ")}` : ""}`);
  }
  for (const t of getTraining()) lines.push(`- Training: ${t.name} (${t.issuer}${t.note ? `, ${t.note.toLowerCase()}` : ""})`);
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
  if (hasNow()) lines.push(`- [Now](${absoluteUrl("/now")}): what ${firstName} is working on now`);
  if (real(profile.links.resume)) lines.push(`- [Résumé (PDF)](${absoluteUrl(profile.links.resume!)})`);
  lines.push("");

  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
