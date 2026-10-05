import { PageHeader } from "@/components/layout/PageHeader";
import { Fillable } from "@/components/ui/FillIn";
import { getNow } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Now",
  description: "What Ehjay Lorenzo is building and learning at the moment.",
  path: "/now",
});

// Phase 3: a plain page so the nav target exists. Designed in phase 7.
export default function NowPage() {
  const now = getNow();
  return (
    <main id="main">
      <PageHeader label="Now" title="Now" />
      <div className="container-site py-16">
        <ul className="space-y-3">
          {now.building.map((b, i) => (
            <li key={i}>
              <Fillable value={b.name} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
