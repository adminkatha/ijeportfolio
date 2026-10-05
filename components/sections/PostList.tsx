import Link from "next/link";
import { formatDate } from "@/components/ui/format";
import type { Post } from "@/lib/content";

/** Posts as an index: date, title, summary. Used by the homepage Writing section and /writing. */
export function PostList({ posts, headingLevel: H }: { posts: Post[]; headingLevel: "h2" | "h3" }) {
  return (
    <ol className="divide-y divide-line border-y border-line">
      {posts.map((post) => (
        <li key={post.slug} className="group relative grid gap-x-(--gutter) gap-y-2 py-6 md:grid-cols-12 lg:grid-cols-9">
          <time dateTime={post.date} className="label-mono pt-1 text-text-2 md:col-span-3 lg:col-span-2">
            {formatDate(post.date)}
          </time>
          <div className="md:col-span-9 lg:col-span-7">
            <H className="type-title text-[1.5rem]">
              <Link
                href={`/writing/${post.slug}`}
                className="after:absolute after:inset-0 after:content-[''] group-hover:text-accent focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-accent"
              >
                {post.title}
              </Link>
            </H>
            <p className="mt-2 text-text-2">{post.summary}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
