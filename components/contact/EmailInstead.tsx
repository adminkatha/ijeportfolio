/**
 * "Email me instead": shown in place of the form while the contact env vars aren't set (the Contact section
 * and the "Let’s connect" pop-up). No hooks and no server code, so server and client components can both render it.
 */
export function EmailInstead({ email }: { email: string }) {
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
