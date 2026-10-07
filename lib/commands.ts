import type { CommandItem } from "@/components/command/types";
import { disciplineLabels, isFillIn } from "@/content/data/schema";
import { getHomeSections, getProfile, getProjects } from "@/lib/content";

/*
 * Every command in the palette, built from content at build time (no facts live here).
 * Placeholders are left out: a link that is still fillIn("…") never becomes a command,
 * and "Download résumé" appears only once profile.links.resume is a real file.
 */
export function getCommandItems(): CommandItem[] {
  const profile = getProfile();
  const real = (value: string | undefined): value is string => Boolean(value) && !isFillIn(value);

  const navigate: CommandItem[] = [
    { id: "nav-home", group: "Navigate", label: "Home", kind: "link", href: "/", keywords: ["top", "start"] },
    ...getHomeSections().map(
      (s): CommandItem => ({ id: `nav-${s.id}`, group: "Navigate", label: s.title, hint: String(s.number).padStart(2, "0"), kind: "link", href: s.href }),
    ),
    { id: "nav-work-all", group: "Navigate", label: "All work", kind: "link", href: "/work", keywords: ["projects", "portfolio", "index"] },
  ];

  const work = getProjects().map(
    (p): CommandItem => ({
      id: `work-${p.slug}`,
      group: "Work",
      label: p.title,
      // Sample campaigns are labelled as such everywhere, the palette included.
      hint: p.isSample ? "Sample campaign" : disciplineLabels[p.discipline],
      keywords: [p.eyebrow, ...[p.discipline, ...p.alsoIn].map((d) => disciplineLabels[d]), ...(p.sector ? [p.sector] : []), ...p.stack].filter(Boolean),
      kind: "link",
      href: `/work/${p.slug}`,
    }),
  );

  const { links } = profile;
  const linkItems: CommandItem[] = [
    { id: "link-email", group: "Links", label: "Email", hint: profile.email, kind: "link", href: `mailto:${profile.email}`, keywords: ["contact", "mail"] },
    ...(real(links.linkedin) ? [{ id: "link-linkedin", group: "Links", label: "LinkedIn", kind: "link", href: links.linkedin, external: true } satisfies CommandItem] : []),
    ...(real(links.github) ? [{ id: "link-github", group: "Links", label: "GitHub", kind: "link", href: links.github, external: true } satisfies CommandItem] : []),
    ...links.other.map((l, i): CommandItem => ({ id: `link-other-${i}`, group: "Links", label: l.label, kind: "link", href: l.href, external: true })),
  ];

  const actions: CommandItem[] = [
    { id: "copy-email", group: "Actions", label: "Copy email address", hint: profile.email, kind: "action", action: "copy-email", value: profile.email },
    { id: "toggle-motion", group: "Actions", label: "Toggle motion", kind: "action", action: "toggle-motion", keywords: ["animation", "reduce", "accessibility"] },
    ...(real(links.resume)
      ? [{ id: "download-resume", group: "Actions", label: "Download résumé", hint: "PDF", kind: "link", href: links.resume, download: true, keywords: ["cv", "resume"] } satisfies CommandItem]
      : []),
    // Opens the contact pop-up on the current page (CommandPalette closes itself first).
    { id: "lets-connect", group: "Actions", label: "Let’s connect", kind: "action", action: "open-contact", keywords: ["hire", "hire me", "contact", "work together", "enquiry", "lets connect"] },
  ];

  return [...navigate, ...work, ...linkItems, ...actions];
}
