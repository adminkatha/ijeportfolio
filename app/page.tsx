import { Container } from "@/components/layout/Grid";
import { SectionLabel } from "@/components/ui/SectionLabel";

// Phase 1 foundations check: tokens, fonts, grain, label and focus styles. Replaced in later phases.
export default function Home() {
  return (
    <main id="main" className="py-24">
      <Container className="space-y-16">
        <h1 className="type-display">Ehjay Lorenzo</h1>
        <SectionLabel number={1} title="Foundations" note="tokens · type · grain" id="foundations" />
        <p className="max-w-[60ch] text-text-2">
          Display in Bricolage Grotesque, body in Geist, labels in JetBrains Mono.{" "}
          <a href="#main" className="text-text underline hover:text-accent">
            A focusable link
          </a>
          .
        </p>
      </Container>
    </main>
  );
}
