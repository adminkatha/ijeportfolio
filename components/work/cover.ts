import type { Project } from "@/content/data/schema";

export type CoverImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Where the cover came from: a demo preview shows sample data and is tagged as such. */
  source: "cover" | "gallery" | "demo" | "video";
};

/**
 * A project's cover: its cover image, else the first gallery image, else the first demo preview, else the
 * first video's poster. null → render a TypographicCover. Never a video or an iframe.
 */
export function coverOf(project: Project): CoverImage | null {
  if (project.cover) return { ...project.cover, source: "cover" };
  const image = project.gallery[0];
  if (image) return { ...image, source: "gallery" };
  const demo = project.demos[0];
  if (demo) return { ...demo.preview, source: "demo" };
  const video = project.videos[0];
  if (video) return { src: video.poster, width: video.width, height: video.height, alt: `Still from the video “${video.title}”`, source: "video" };
  return null;
}

/**
 * How a cover sits in the 4:3 frame. Near-4:3 images (screens, dashboards: ~1.2–1.7) fill it, anchored to the
 * top (top-left for dashboard previews, so the logo and title stay in view). Everything else (tall ads,
 * square posts, 2.2:1 website recordings) sits whole on a mat: never cropped.
 */
export function coverFit(image: CoverImage): string {
  const ratio = image.width / image.height;
  if (ratio < 1.2 || ratio > 1.7) return "object-contain p-[7%]";
  return image.source === "demo" ? "object-cover object-left-top" : "object-cover object-top";
}
