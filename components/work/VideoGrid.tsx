import { VideoPlayer } from "@/components/media/VideoPlayer";
import type { Video } from "@/content/data/schema";

const VERTICAL_SIZES = "(min-width: 1328px) 302px, (min-width: 1024px) 23vw, (min-width: 768px) 31vw, calc(50vw - 24px)";
const WIDE_ONE = "(min-width: 1328px) 1280px, calc(100vw - 32px)";
const WIDE_TWO = "(min-width: 1328px) 628px, (min-width: 768px) 48vw, calc(100vw - 32px)";

/**
 * Videos, poster-first. Vertical clips (9:16 and the like) sit in a grid of 2 / 3 / 4; wide screen
 * recordings get the full width (two per row when there are more than two).
 */
export function VideoGrid({ videos }: { videos: Video[] }) {
  const vertical = videos.filter((v) => v.height > v.width);
  const wide = videos.filter((v) => v.height <= v.width);
  return (
    <div className="space-y-14">
      {vertical.length ? (
        <ul className="grid grid-cols-2 items-start gap-x-(--gutter) gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {vertical.map((v) => (
            <li key={`${v.src}-${v.title}`}>
              <VideoPlayer video={v} sizes={VERTICAL_SIZES} />
            </li>
          ))}
        </ul>
      ) : null}
      {wide.length ? (
        <ul className={`grid items-start gap-x-(--gutter) gap-y-12 ${wide.length > 2 ? "md:grid-cols-2" : ""}`}>
          {wide.map((v) => (
            <li key={`${v.src}-${v.title}`}>
              <VideoPlayer video={v} sizes={wide.length > 2 ? WIDE_TWO : WIDE_ONE} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
