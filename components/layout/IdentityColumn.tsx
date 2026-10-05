import Image from "next/image";
import Link from "next/link";
import { isFillIn } from "@/content/data/schema";
import { Fillable } from "@/components/ui/FillIn";
import { FillableLink } from "@/components/ui/FillableLink";
import { formatDate } from "@/components/ui/format";
import { getNow, getProfile, type HomeSection } from "@/lib/content";
import { SectionIndex } from "./SectionIndex";
import { getProfileLinks } from "./nav";

/** Viewfinder corners around the portrait (decorative). */
function Corners() {
  const mark = "absolute size-3 border-text-3";
  return (
    <span aria-hidden="true">
      <span className={`${mark} -top-2 -left-2 border-t border-l`} />
      <span className={`${mark} -top-2 -right-2 border-t border-r`} />
      <span className={`${mark} -bottom-2 -left-2 border-b border-l`} />
      <span className={`${mark} -right-2 -bottom-2 border-r border-b`} />
    </span>
  );
}

/**
 * Who this is, beside the homepage content. ≥1024px: a sticky column (portrait, name, title, section index,
 * links, Now status). Below that: a compact card under the hero (no index; the menu covers navigation).
 * The portrait is shown whole, at its own 3:4 ratio: never cropped or split.
 */
export function IdentityColumn({ sections }: { sections: HomeSection[] }) {
  const profile = getProfile();
  const now = getNow();
  const building = now.building[0];
  return (
    <div className="border-b border-line py-10 lg:col-span-3 lg:border-b-0 lg:py-0">
      <div className="scrollbar-quiet grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-5 sm:grid-cols-[7rem_minmax(0,1fr)] lg:sticky lg:top-[calc(var(--header-h)+2.5rem)] lg:-mx-2 lg:max-h-[calc(100dvh-var(--header-h)-3.5rem)] lg:grid-cols-1 lg:overflow-y-auto lg:px-2 lg:pt-2 lg:pb-4">
        <figure className="relative row-span-4 self-start lg:row-span-1 lg:mt-2 lg:ml-2 lg:w-28 xl:w-40">
          <Image
            src={profile.photo.src}
            width={profile.photo.width}
            height={profile.photo.height}
            alt={profile.photo.alt}
            sizes="(min-width: 1280px) 160px, (min-width: 1024px) 112px, (min-width: 640px) 112px, 88px"
            quality={82}
            className="h-auto w-full bg-surface"
          />
          <Corners />
        </figure>

        <p className="type-title text-[1.375rem] uppercase lg:mt-6">{profile.name}</p>
        <p className="text-sm text-text-2">{profile.title}</p>

        <nav aria-label="Sections" className="mt-6 hidden lg:block">
          <p className="label-mono text-text-2">Index</p>
          <SectionIndex sections={sections.map(({ id, title, number }) => ({ id, title, number }))} />
        </nav>

        <ul className="label-mono mt-4 flex flex-wrap gap-x-4 gap-y-1 lg:mt-6 lg:block lg:space-y-0.5">
          <li className="flex min-h-11 items-center lg:min-h-7">
            <a href={`mailto:${profile.email}`} className="link-quiet group inline-flex items-center gap-2">
              Email
              <span aria-hidden="true" className="transition-transform duration-(--dur-1) ease-out group-hover:translate-x-0.5">
                →
              </span>
            </a>
          </li>
          {getProfileLinks().map((l) => (
            <li key={l.label} className="flex min-h-11 items-center lg:min-h-7">
              <FillableLink href={l.href} className="link-quiet normal-case">
                <span className="uppercase">{l.label}</span>
              </FillableLink>
            </li>
          ))}
        </ul>

        <div className="mt-3 border-t border-line pt-2 lg:mt-6">
          <Link href="/now" className="label-mono link-quiet group inline-flex min-h-11 items-center gap-2 text-text-2 lg:min-h-8">
            <span aria-hidden="true" className="block size-1.5 bg-text" />
            Now
            <span aria-hidden="true" className="transition-transform duration-(--dur-1) ease-out group-hover:translate-x-0.5">
              →
            </span>
          </Link>
          {building ? (
            <p className="text-sm">
              <Fillable value={building.name} />
            </p>
          ) : null}
          <p className="label-mono mt-2 text-text-2">
            Updated{" "}
            {isFillIn(now.updatedAt) ? (
              <Fillable value={now.updatedAt} />
            ) : (
              <time dateTime={now.updatedAt}>{formatDate(now.updatedAt)}</time>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
