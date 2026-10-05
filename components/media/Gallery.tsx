import Image from "next/image";
import type { Image as GalleryImage } from "@/content/data/schema";

type GalleryProps = {
  images: GalleryImage[];
  /** Level for the set names (image.group). */
  headingLevel?: "h2" | "h3";
  /** Prefix for heading ids (unique per page). */
  idPrefix?: string;
  className?: string;
};

type ImageSet = { name: string | null; images: GalleryImage[] };

/** Groups images by `group` (a carousel or set), keeping first-appearance order; ungrouped images form one set. */
function setsOf(images: GalleryImage[]): ImageSet[] {
  const sets: ImageSet[] = [];
  for (const image of images) {
    const name = image.group ?? null;
    const set = sets.find((s) => s.name === name);
    if (set) set.images.push(image);
    else sets.push({ name, images: [image] });
  }
  return sets;
}

/** Wide sets (screens, dashboards) get two columns; tall and square sets (ads, carousels) get three. */
const isWide = (images: GalleryImage[]) => images.reduce((sum, i) => sum + i.width / i.height, 0) / images.length >= 1.25;

const WIDE = { grid: "md:grid-cols-2", sizes: "(min-width: 1328px) 628px, (min-width: 768px) 48vw, calc(100vw - 32px)" };
const TALL = {
  grid: "sm:grid-cols-2 lg:grid-cols-3",
  sizes: "(min-width: 1328px) 411px, (min-width: 1024px) 31vw, (min-width: 640px) 47vw, calc(100vw - 32px)",
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * The project's images, grouped by set, each at its own aspect ratio (width/height reserve the space, so
 * nothing shifts). Captions under the images. Sized for the full 1280px container.
 */
export function Gallery({ images, headingLevel: H = "h3", idPrefix = "gallery", className = "" }: GalleryProps) {
  const sets = setsOf(images);
  return (
    <div className={`space-y-14 ${className}`}>
      {sets.map((set, si) => {
        const layout = isWide(set.images) ? WIDE : TALL;
        const headingId = set.name ? `${idPrefix}-${slug(set.name)}` : undefined;
        return (
          <div key={set.name ?? `set-${si}`} className="space-y-5">
            {set.name ? (
              <div className="label-mono flex items-center gap-4 text-text-2">
                <H id={headingId} className="font-normal text-text">
                  {set.name}
                </H>
                <span aria-hidden="true" className="h-px flex-1 bg-line" />
                <span>
                  {set.images.length} {set.images.length === 1 ? "image" : "images"}
                </span>
              </div>
            ) : null}
            <ul className={`grid items-start gap-x-(--gutter) gap-y-8 ${layout.grid}`}>
              {set.images.map((image) => (
                <li key={image.src}>
                  <figure>
                    <div className="overflow-hidden border border-line bg-surface">
                      <Image src={image.src} alt={image.alt} width={image.width} height={image.height} sizes={layout.sizes} className="h-auto w-full" />
                    </div>
                    {image.caption ? <figcaption className="mt-3 text-sm text-text-2">{image.caption}</figcaption> : null}
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
