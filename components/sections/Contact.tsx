import { ContactForm } from "@/components/contact/ContactForm";
import { getProfileLinks } from "@/components/layout/nav";
import { Reveal } from "@/components/motion/Reveal";
import { FillableLink } from "@/components/ui/FillableLink";
import { getProfile } from "@/lib/content";
import { Section } from "./Section";

/** The last section: the one big line, email, links, availability (when given) and the form. No phone, ever. */
export function Contact({ number }: { number: number }) {
  const { email, availability } = getProfile();
  const at = email.indexOf("@");
  return (
    <Section id="contact" number={number} title="Contact" headingId="contact-heading">
      <h2 id="contact-heading" className="type-display-md mt-10 md:mt-12">
        Let&rsquo;s build something useful.
      </h2>
      <div className="mt-12 grid gap-x-(--gutter) gap-y-14 md:mt-16 md:grid-cols-12 lg:grid-cols-9">
        <Reveal className="md:col-span-5 lg:col-span-4">
          <p className="label-mono text-text-2">Email</p>
          <a
            href={`mailto:${email}`}
            className="group mt-3 inline-flex items-baseline gap-3 font-display text-[clamp(1.25rem,0.95rem+1vw,1.75rem)] leading-tight font-semibold tracking-[-0.02em] hover:text-accent"
          >
            {/* Breaks only after the "@" on narrow screens. */}
            <span className="underline decoration-text-3 decoration-1 underline-offset-[0.2em] group-hover:decoration-accent">
              {email.slice(0, at + 1)}
              <wbr />
              {email.slice(at + 1)}
            </span>
            <span aria-hidden="true" className="transition-transform duration-(--dur-1) ease-out group-hover:translate-x-1">
              →
            </span>
          </a>
          {availability ? <p className="mt-6 max-w-[40ch] text-text-2">{availability}</p> : null}
          <p className="label-mono mt-10 text-text-2">Elsewhere</p>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {getProfileLinks().map((l) => (
              <li key={l.label} className="flex min-h-12 items-center py-2">
                <FillableLink href={l.href} className="link-quiet">
                  {l.label}
                </FillableLink>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal className="md:col-span-7 lg:col-span-5" delay={60}>
          <ContactForm />
        </Reveal>
      </div>
    </Section>
  );
}
