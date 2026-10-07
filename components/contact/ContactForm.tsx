import { getContactConfig } from "@/lib/contact/config";
import { getProfile } from "@/lib/content";
import { ContactFormClient } from "./ContactFormClient";
import { EmailInstead } from "./EmailInstead";

/**
 * The Contact section's form (server component; no props). Without CONTACT_WEBHOOK_URL + CONTACT_SECRET it renders
 * the "Email me instead" block (shared with the "Let’s connect" pop-up), so the site never breaks.
 * Setup: docs/CONTACT-SETUP.md.
 */
export function ContactForm() {
  const { email } = getProfile();
  if (!getContactConfig()) return <EmailInstead email={email} />;
  return <ContactFormClient email={email} />;
}
