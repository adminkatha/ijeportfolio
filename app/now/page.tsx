import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { NowContent } from "@/components/sections/NowContent";
import { UpdatedAt } from "@/components/sections/UpdatedAt";
import { hasNow } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Now",
  description: "What Ehjay Lorenzo is building and learning at the moment.",
  path: "/now",
});

/** /now: what has his attention at the moment, and when that was last true. A 404 while there's nothing in it. */
export default function NowPage() {
  if (!hasNow()) notFound();
  return (
    <main id="main">
      <PageHeader label="/now" title="Now" aside={<UpdatedAt />}>
        <p>What I&rsquo;m building and learning at the moment.</p>
      </PageHeader>
      <div className="container-site py-16 md:py-24">
        <div className="lg:grid-12">
          <div className="lg:col-span-9">
            <NowContent headingLevel="h2" />
          </div>
        </div>
      </div>
    </main>
  );
}
