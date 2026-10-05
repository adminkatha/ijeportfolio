import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Mdx } from "@/components/mdx/Mdx";
import { formatDate } from "@/components/ui/format";
import { getPosts } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

const postOf = (slug: string) => getPosts().find((p) => p.slug === slug);

export async function generateMetadata({ params }: PageProps<"/writing/[slug]">) {
  const { slug } = await params;
  const post = postOf(slug);
  if (!post) notFound();
  return pageMetadata({ title: post.title, description: post.summary, path: `/writing/${post.slug}`, type: "article" });
}

/** A post. Unknown slugs (and every slug while there are no posts) are a 404. */
export default async function PostPage({ params }: PageProps<"/writing/[slug]">) {
  const { slug } = await params;
  const post = postOf(slug);
  if (!post) notFound();
  return (
    <main id="main">
      <PageHeader
        label={
          <>
            <Link href="/writing" className="link-quiet">
              Writing
            </Link>
            <span aria-hidden="true">/</span>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
          </>
        }
        title={post.title}
      >
        <p>{post.summary}</p>
      </PageHeader>
      <article className="container-site py-16 md:py-24">
        <Mdx code={post.body} />
      </article>
    </main>
  );
}
