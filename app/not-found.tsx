import Link from "next/link";
import { ColumnGuides } from "@/components/layout/ColumnGuides";

const links = [
  { href: "/", label: "Home" },
  { href: "/work", label: "All work" },
  { href: "/#contact", label: "Contact" },
];

/** 404: unknown URLs and every notFound() (unknown project slugs, empty Playground/Writing). */
export default function NotFound() {
  return (
    <main id="main" className="relative overflow-hidden">
      <ColumnGuides span="page" className="absolute inset-0" />
      <div className="container-site relative grid-12 py-24 md:py-36">
        <div className="col-span-12 md:col-span-10 lg:col-span-8">
          <p className="label-mono text-text-2">
            <span aria-hidden="true">[</span>
            <span className="text-accent">404</span>
            <span aria-hidden="true">]</span> Page not found
          </p>
          <h1 className="type-display-md mt-6">Off the grid.</h1>
          <p className="mt-8 max-w-[44ch] text-lg text-text-2">
            Nothing lives at this address. The link may be old, or the page may have moved. The work is all still here.
          </p>
          <ul className="label-mono mt-12 flex flex-wrap gap-3">
            {links.map((l, i) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`group inline-flex h-12 items-center gap-3 px-5 ${i === 0 ? "bg-accent text-accent-ink" : "border border-text-3 text-text hover:border-text"}`}
                >
                  {l.label}
                  <span aria-hidden="true" className="transition-transform duration-(--dur-1) ease-out group-hover:translate-x-0.5">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
