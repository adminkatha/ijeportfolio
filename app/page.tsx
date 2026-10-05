import type { ReactNode } from "react";
import { HeroSeam } from "@/components/hero/HeroSeam";
import { IdentityColumn } from "@/components/layout/IdentityColumn";
import { JsonLd } from "@/components/seo/JsonLd";
import { Capabilities } from "@/components/sections/Capabilities";
import { Contact } from "@/components/sections/Contact";
import { Experience } from "@/components/sections/Experience";
import { Now } from "@/components/sections/Now";
import { PlaygroundPreview } from "@/components/sections/PlaygroundPreview";
import { SelectedWork } from "@/components/sections/SelectedWork";
import { Writing } from "@/components/sections/Writing";
import { getHomeSections, getProfile, type HomeSectionId } from "@/lib/content";
import { personJsonLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: getProfile().title,
  description: getProfile().positioning,
  path: "/",
});

const SECTIONS: Record<HomeSectionId, (props: { number: number }) => ReactNode> = {
  work: SelectedWork,
  capabilities: Capabilities,
  experience: Experience,
  now: Now,
  playground: PlaygroundPreview,
  writing: Writing,
  contact: Contact,
};

/**
 * Hero (full-bleed), then the identity column beside the sections. Only visible sections render
 * (getHomeSections() drops empty Playground/Writing), so numbers have no gaps.
 */
export default function Home() {
  const profile = getProfile();
  const sections = getHomeSections();
  return (
    <main id="main">
      <JsonLd data={personJsonLd()} />
      <HeroSeam name={profile.name} title={profile.title} roleLine={profile.roleLine} cta={{ label: "See the work →", href: "#work" }} />
      <div className="container-site lg:grid-12">
        <IdentityColumn sections={sections} />
        <div className="divide-y divide-line lg:relative lg:col-span-9 lg:before:absolute lg:before:inset-y-0 lg:before:left-[calc(var(--gutter)/-2)] lg:before:w-px lg:before:bg-line">
          {sections.map((s) => {
            const Component = SECTIONS[s.id];
            return <Component key={s.id} number={s.number} />;
          })}
        </div>
      </div>
    </main>
  );
}
