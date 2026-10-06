import Link from "next/link";
import { FillableLink } from "@/components/ui/FillableLink";
import { getProfile } from "@/lib/content";
import { ColumnGuides } from "./ColumnGuides";
import { getNavItems, getProfileLinks } from "./nav";

/** Site footer: name, email, links, back to top. No phone number, ever. */
export function Footer() {
  const { name, title, email } = getProfile();
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-16 border-t border-line">
      <ColumnGuides className="absolute inset-x-0 top-0 h-2.5 md:h-3" span="page" />
      <div className="container-site grid-12 gap-y-12 pt-16 pb-14">
        <div className="col-span-12 md:col-span-6">
          <p className="type-title text-[1.75rem] uppercase md:text-[2.25rem]">{name}</p>
          <p className="mt-1 text-text-2">{title}</p>
          <a href={`mailto:${email}`} className="link mt-6 inline-block text-lg [overflow-wrap:anywhere]">
            {email}
          </a>
        </div>
        <nav aria-label="Footer" className="col-span-6 md:col-span-3">
          <p className="label-mono text-text-2">Site</p>
          <ul className="mt-4 space-y-1">
            <li>
              <Link href="/" className="link-quiet inline-flex min-h-11 items-center md:min-h-8">
                Home
              </Link>
            </li>
            {getNavItems().map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="link-quiet inline-flex min-h-11 items-center md:min-h-8">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="col-span-6 md:col-span-3">
          <p className="label-mono text-text-2">Elsewhere</p>
          <ul className="mt-4 space-y-1">
            <li>
              <a href={`mailto:${email}`} className="link-quiet inline-flex min-h-11 items-center md:min-h-8">
                Email
              </a>
            </li>
            {getProfileLinks().map((l) => (
              <li key={l.label} className="flex min-h-11 items-center md:min-h-8">
                <FillableLink href={l.href} className="link-quiet">
                  {l.label}
                </FillableLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-site label-mono flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-5 text-text-2">
          <p>
            © {year} {name}
          </p>
          <a href="#top" className="link-quiet group inline-flex min-h-11 items-center gap-2 md:min-h-8">
            Back to top
            <span aria-hidden="true" className="transition-transform duration-(--dur-1) ease-out group-hover:-translate-y-0.5">
              ↑
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
