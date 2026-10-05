// STUB (owned by the hero/palette agent; refined in phase 12). Keep this export name.
import type { CommandItem } from "@/components/command/types";
import { getHomeSections, getProfile, getProjects } from "@/lib/content";

/** Every command in the palette, built from content at build time. */
export function getCommandItems(): CommandItem[] {
  const profile = getProfile();
  return [
    ...getHomeSections().map((s): CommandItem => ({ id: `nav-${s.id}`, group: "Navigate", label: s.title, kind: "link", href: s.href })),
    { id: "nav-work-all", group: "Navigate", label: "All work", kind: "link", href: "/work" },
    ...getProjects().map((p): CommandItem => ({ id: `work-${p.slug}`, group: "Work", label: p.title, hint: p.eyebrow, kind: "link", href: `/work/${p.slug}` })),
    { id: "copy-email", group: "Actions", label: "Copy email address", hint: profile.email, kind: "action", action: "copy-email" },
    { id: "toggle-motion", group: "Actions", label: "Toggle motion", kind: "action", action: "toggle-motion" },
  ];
}
