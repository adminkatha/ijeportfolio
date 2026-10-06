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

const isWide = (images: GalleryImage[]) => images.reduce((sum, i) => sum + i.width / i.height, 0) / images.length >= 1.25;

/** One column of the 1280px container at each breakpoint (3 / 2 / 1 columns). */
const COLUMN = "(min-width: 1328px) 411px, (min-width: 1024px) 31vw, (min-width: 640px) 47vw, calc(100vw - 32px)";

/**
 * How much of the outer grid a set takes, its own columns, and the image `sizes` to match. Tall and square
 * pieces (ads, carousel slides) take one column each, so small sets share a row; wide pieces (screens) get
 * two thirds of the width alone, or half each when there are several.
 */
function layoutOf(set: ImageSet) {
  const n = set.images.length;
  if (isWide(set.images)) {
    return n === 1
      ? { span: "sm:col-span-2", inner: "", sizes: "(min-width: 1328px) 846px, (min-width: 1024px) 64vw, (min-width: 640px) 94vw, calc(100vw - 32px)" }
      : { span: "sm:col-span-2 lg:col-span-3", inner: "sm:grid-cols-2", sizes: "(min-width: 1328px) 628px, (min-width: 640px) 47vw, calc(100vw - 32px)" };
  }
  if (n === 1) return { span: "", inner: "", sizes: COLUMN };
  if (n === 2) return { span: "sm:col-span-2", inner: "sm:grid-cols-2", sizes: COLUMN };
  return { span: "sm:col-span-2 lg:col-span-3", inner: "sm:grid-cols-2 lg:grid-cols-3", sizes: COLUMN };
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * The project's images grouped by set (name + count), each at its own aspect ratio: width/height reserve the
 * space, so nothing shifts. Sets flow side by side (dense packing), captions sit under their images.
 */
export function Gallery({ images, headingLevel: H = "h3", idPrefix = "gallery", className = "" }: GalleryProps) {
  return (
    <ul className={`grid grid-flow-row-dense items-start gap-x-(--gutter) gap-y-14 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {setsOf(images).map((set, si) => {
        const layout = layoutOf(set);
        const headingId = set.name ? `${idPrefix}-${slug(set.name)}` : undefined;
        return (
          <li key={set.name ?? `set-${si}`} className={`space-y-4 ${layout.span}`}>
            {set.name ? (
              <div className="label-mono flex items-baseline gap-4 text-text-2">
                <H id={headingId} className="font-normal text-text">
                  {set.name}
                </H>
                <span aria-hidden="true" className="h-px min-w-4 flex-1 translate-y-[-0.3em] bg-line" />
                <span className="shrink-0">
                  {set.images.length} {set.images.length === 1 ? "image" : "images"}
                </span>
              </div>
            ) : null}
            <ul aria-labelledby={headingId} className={`grid items-start gap-x-(--gutter) gap-y-8 ${layout.inner}`}>
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
          </li>
        );
      })}
    </ul>
  );
}
