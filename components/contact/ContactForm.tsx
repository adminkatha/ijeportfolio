import { getContactConfig } from "@/lib/contact/config";
import { getProfile } from "@/lib/content";
import { ContactFormClient } from "./ContactFormClient";

/**
 * The hire-me form (server component; no props). Without CONTACT_WEBHOOK_URL + CONTACT_SECRET it renders an
 * "Email me instead" block, so the site never breaks. Setup: docs/CONTACT-SETUP.md.
 */
export function ContactForm() {
  const { email } = getProfile();
  if (!getContactConfig()) return <EmailInstead email={email} />;
  return <ContactFormClient email={email} />;
}

function EmailInstead({ email }: { email: string }) {
  return (
    <div data-contact-fallback="" className="space-y-3">
      <p className="label-mono text-text-2">Email me instead</p>
      <a
        href={`mailto:${email}`}
        className="inline-block font-display text-2xl leading-tight [overflow-wrap:anywhere] text-text underline decoration-text-3 decoration-1 underline-offset-[0.2em] transition-colors duration-[var(--dur-1)] hover:decoration-text sm:text-3xl"
      >
        {email}
      </a>
    </div>
  );
}
