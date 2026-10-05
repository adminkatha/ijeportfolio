import Link from "next/link";
import { getPosts } from "@/lib/content";
import { PostList } from "./PostList";
import { Section } from "./Section";

const PREVIEW = 3;

/** Writing on the homepage. Renders nothing while there are no posts (no DOM, no nav link, no number). */
export function Writing({ number }: { number: number }) {
  const posts = getPosts();
  if (!posts.length) return null;
  return (
    <Section id="writing" number={number} title="Writing" note={`${posts.length} ${posts.length === 1 ? "post" : "posts"}`}>
      <div className="mt-10 md:mt-12">
        <PostList posts={posts.slice(0, PREVIEW)} headingLevel="h3" />
      </div>
      <Link href="/writing" className="group label-mono mt-12 inline-flex min-h-11 items-center gap-3 text-text hover:text-accent">
        {posts.length > PREVIEW ? `All ${posts.length} posts` : "All writing"}
        <span aria-hidden="true" className="transition-transform duration-(--dur-1) ease-out group-hover:translate-x-1">
          →
        </span>
      </Link>
    </Section>
  );
}
