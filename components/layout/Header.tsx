import Link from "next/link";
import { CommandButton } from "@/components/command/CommandButton";
import { getCommandItems } from "@/lib/commands";
import { getProfile } from "@/lib/content";
import { ContactLink } from "./ContactLink";
import { MobileMenu } from "./MobileMenu";
import { NavLinks } from "./NavLinks";
import { getNavItems } from "./nav";

/** Sticky site header: wordmark, primary nav, the résumé, ⌘K, and the one primary CTA ("Let’s connect": the contact pop-up). */
export function Header() {
  const { name, links } = getProfile();
  const items = getNavItems();
  return (
    <header id="top" className="sticky top-0 z-40 border-b border-line bg-bg bg-[url(/grain.png)]">
      <div className="container-site flex h-(--header-h) items-center gap-3">
        <Link
          href="/"
          aria-label={`${name}, home`}
          className="mr-auto inline-flex h-11 items-center gap-2.5 font-display text-[1.0625rem] leading-none font-bold tracking-[-0.02em] uppercase"
        >
          <span aria-hidden="true" className="block size-2 bg-text" />
          {name}
        </Link>
        <nav aria-label="Main" className="hidden md:block">
          <NavLinks items={items} variant="bar" />
        </nav>
        {links.resume ? (
          <a
            href={links.resume}
            download="Ehjay-Lorenzo-Resume.pdf"
            className="label-mono link-quiet hidden h-10 items-center gap-1.5 px-2 text-text-2 hover:text-text md:inline-flex"
          >
            Résumé
            <span aria-hidden="true">↓</span>
            <span className="sr-only"> (PDF)</span>
          </a>
        ) : null}
        {/* Before ⌘K in DOM and visual order under 768px (wordmark · Menu · ⌘K). */}
        <MobileMenu items={items} resumeHref={links.resume} />
        <CommandButton items={getCommandItems()} />
        <ContactLink className="group label-mono hidden h-10 items-center gap-2 bg-accent px-4 text-accent-ink md:inline-flex">
          Let&rsquo;s connect
          <span aria-hidden="true" className="transition-transform duration-(--dur-1) ease-out group-hover:translate-x-0.5">
            →
          </span>
        </ContactLink>
      </div>
    </header>
  );
}
