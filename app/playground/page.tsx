import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlaygroundGrid } from "@/components/sections/PlaygroundGrid";
import { getPlayground, hasPlayground } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Playground",
  description: "Experiments and side projects by Ehjay Lorenzo.",
  path: "/playground",
});

/** /playground: 404 while there are no items (and it has no nav link or sitemap entry). */
export default function PlaygroundPage() {
  if (!hasPlayground()) notFound();
  const items = getPlayground();
  return (
    <main id="main">
      <PageHeader label="Experiments" title="Playground" />
      <div className="container-site py-16 md:py-24">
        <PlaygroundGrid items={items} headingLevel="h2" sizes="(min-width: 1328px) 628px, (min-width: 768px) 48vw, calc(100vw - 32px)" />
      </div>
    </main>
  );
}
