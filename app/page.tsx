import { ContactForm } from "@/components/contact/ContactForm";
import { HeroSeam } from "@/components/hero/HeroSeam";
import { IdentityColumn } from "@/components/layout/IdentityColumn";
import { JsonLd } from "@/components/seo/JsonLd";
import { Capabilities } from "@/components/sections/Capabilities";
import { Experience } from "@/components/sections/Experience";
import { Section } from "@/components/sections/Section";
import { SelectedWork } from "@/components/sections/SelectedWork";
import { Fillable } from "@/components/ui/FillIn";
import { getHomeSections, getNow, getProfile, type HomeSectionId } from "@/lib/content";
import { personJsonLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: getProfile().title,
  description: getProfile().positioning,
  path: "/",
});

// Now and Contact are plain here; they get their designs in phase 7.
export default function Home() {
  const profile = getProfile();
  const sections = getHomeSections();
  const numberOf = (id: HomeSectionId) => sections.find((s) => s.id === id)?.number;
  const show = (id: HomeSectionId) => numberOf(id) !== undefined;
  const now = getNow();

  return (
    <main id="main">
      <JsonLd data={personJsonLd()} />
      <HeroSeam name={profile.name} title={profile.title} roleLine={profile.roleLine} cta={{ label: "See the work →", href: "#work" }} />
      <div className="container-site lg:grid-12">
        <IdentityColumn sections={sections} />
        <div className="divide-y divide-line lg:relative lg:col-span-9 lg:before:absolute lg:before:inset-y-0 lg:before:left-[calc(var(--gutter)/-2)] lg:before:w-px lg:before:bg-line">
          {show("work") ? <SelectedWork number={numberOf("work")!} /> : null}
          {show("capabilities") ? <Capabilities number={numberOf("capabilities")!} /> : null}
          {show("experience") ? <Experience number={numberOf("experience")!} /> : null}
          {show("now") ? (
            <Section id="now" number={numberOf("now")!} title="Now">
              <ul className="mt-10 space-y-3">
                {now.building.map((b, i) => (
                  <li key={i}>
                    <Fillable value={b.name} />
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
          {show("contact") ? (
            <Section id="contact" number={numberOf("contact")!} title="Contact" headingId="contact-heading">
              <h2 id="contact-heading" className="type-display-md mt-10">
                Let&rsquo;s build something useful.
              </h2>
              <div className="mt-10">
                <ContactForm />
              </div>
            </Section>
          ) : null}
        </div>
      </div>
    </main>
  );
}
