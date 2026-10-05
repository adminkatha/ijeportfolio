import { isFillIn } from "@/content/data/schema";
import { getProfile } from "@/lib/content";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

// The site-wide share image (the homepage, and any page without its own). Generated at build time.
const profile = getProfile();

export const alt = `${profile.name}, ${profile.title}: ${profile.roleLine}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return renderOgCard({
    label: "Portfolio",
    corner: "Creative | Code",
    title: profile.name,
    subtitle: isFillIn(profile.roleLine) ? undefined : profile.roleLine,
    footer: profile.title,
  });
}
