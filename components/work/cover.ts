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

/** Tall pieces (ads, vertical video) sit whole on a mat; wide ones (screens, dashboards) fill the frame. */
export const fitOf = (image: { width: number; height: number }, frameRatio = 4 / 3): "cover" | "contain" =>
  image.width / image.height >= frameRatio * 0.9 ? "cover" : "contain";
