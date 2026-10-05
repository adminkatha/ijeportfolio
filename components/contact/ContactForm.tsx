// STUB (owned by the contact agent; replaced in the contact phase). Keep this export name (no props).
import { getProfile } from "@/lib/content";

/** The hire-me form; falls back to "Email me instead" when the webhook env vars are missing. */
export function ContactForm() {
  const { email } = getProfile();
  return (
    <p className="text-text-2">
      Email me instead: <a className="text-text underline" href={`mailto:${email}`}>{email}</a>
    </p>
  );
}
