import { getProfile, hasPlayground, hasWriting } from "@/lib/content";

export type NavItem = {
  label: string;
  href: string;
  /** Path prefix that marks the item as current (exact match → "page", deeper → "true"). */
  match?: string;
};

/** Primary navigation. Playground and Writing appear only once they have content. */
export function getNavItems(): NavItem[] {
  return [
    { label: "Work", href: "/work", match: "/work" },
    { label: "Now", href: "/now", match: "/now" },
    ...(hasPlayground() ? [{ label: "Playground", href: "/playground", match: "/playground" }] : []),
    ...(hasWriting() ? [{ label: "Writing", href: "/writing", match: "/writing" }] : []),
    { label: "Contact", href: "/#contact" },
  ];
}

export type ProfileLink = {
  label: string;
  /** URL or site path, or a fillIn("…") placeholder (rendered as a visible gap, never as a link). */
  href: string;
};

/** His public links from content/data/profile.ts, in a fixed order. No phone, ever. */
export function getProfileLinks(): ProfileLink[] {
  const { links } = getProfile();
  return [
    ...(links.linkedin ? [{ label: "LinkedIn", href: links.linkedin }] : []),
    ...(links.github ? [{ label: "GitHub", href: links.github }] : []),
    { label: "Résumé", href: links.resume },
    ...links.other.map((o) => ({ label: o.label, href: o.href })),
  ];
}
