import { isFillIn } from "@/content/data/schema";
import { getNow, getProfile } from "@/lib/content";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og";

// The /now share image, generated at build time. Unanswered [FILL IN] values are left out.
const profile = getProfile();

export const alt = `Now: what ${profile.name} is building and learning`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  const now = getNow();
  const building = now.building.map((b) => b.name).filter((name) => !isFillIn(name));
  return renderOgCard({
    label: isFillIn(now.updatedAt) ? "Now" : `Now · updated ${now.updatedAt}`,
    corner: "Creative | Code",
    title: "Now",
    subtitle: building.length ? `Building: ${building.join(", ")}` : "What I'm building and learning.",
    footer: `${profile.name} · ${profile.title}`,
  });
}
