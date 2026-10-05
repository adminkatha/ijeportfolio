// STUB (owned by the hero agent; replaced in phases 4 and 11). Keep this export name and props.
export type HeroSeamProps = {
  name: string;
  title: string;
  roleLine: string;
  cta: { label: string; href: string };
};

/** The CREATIVE | CODE hero. Renders the page's only <h1> (the name). */
export function HeroSeam({ name, roleLine, cta }: HeroSeamProps) {
  return (
    <section aria-labelledby="hero-title" className="container-site py-24">
      <h1 id="hero-title" className="type-display">
        {name}
      </h1>
      <p className="mt-6 max-w-[40ch] text-lg text-text-2">{roleLine}</p>
      <a href={cta.href} className="label-mono mt-8 inline-block bg-accent px-4 py-3 text-accent-ink">
        {cta.label}
      </a>
    </section>
  );
}
