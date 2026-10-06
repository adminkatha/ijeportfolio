import Image from "next/image";
import type { PlaygroundItem } from "@/content/data/schema";

type PlaygroundGridProps = {
  items: PlaygroundItem[];
  headingLevel: "h2" | "h3";
  /** next/image sizes for the media, matching the grid. */
  sizes: string;
};

/** Experiments as a grid of small cards. Used by the homepage preview and /playground. */
export function PlaygroundGrid({ items, headingLevel: H, sizes }: PlaygroundGridProps) {
  return (
    <ul className="grid gap-x-(--gutter) gap-y-12 md:grid-cols-2">
      {items.map((item) => (
        <li key={item.href}>
          <article className="group relative flex h-full flex-col border-t border-line pt-5">
            {item.media ? (
              <div className="relative mb-5 overflow-hidden border border-line bg-surface">
                <Image
                  src={item.media.src}
                  alt={item.media.alt}
                  width={item.media.width}
                  height={item.media.height}
                  sizes={sizes}
                  className="h-auto w-full transition-transform duration-(--dur-1) ease-out group-hover:scale-[1.02]"
                />
              </div>
            ) : null}
            <H className="type-title text-[1.5rem]">
              <a
                href={item.href}
                className="after:absolute after:inset-0 after:content-[''] group-hover:text-accent focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-accent"
              >
                {item.title}
              </a>
            </H>
            <p className="mt-3 text-text-2">{item.description}</p>
            <span aria-hidden="true" className="label-mono mt-auto inline-flex items-center gap-2 pt-5 text-text">
              Open
              <span className="transition-transform duration-(--dur-1) ease-out group-hover:translate-x-1">→</span>
            </span>
          </article>
        </li>
      ))}
    </ul>
  );
}
