import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { PostList } from "@/components/sections/PostList";
import { getPosts, hasWriting } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Writing",
  description: "Notes by Ehjay Lorenzo on ad creative, campaigns and the systems that measure them.",
  path: "/writing",
});

/** /writing: 404 while there are no posts (and it has no nav link or sitemap entry). */
export default function WritingPage() {
  if (!hasWriting()) notFound();
  return (
    <main id="main">
      <PageHeader label="Notes" title="Writing" />
      <div className="container-site py-16 md:py-24">
        <PostList posts={getPosts()} headingLevel="h2" />
      </div>
    </main>
  );
}
