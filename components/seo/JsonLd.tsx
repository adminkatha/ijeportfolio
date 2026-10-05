/**
 * Renders JSON-LD. Escapes <, >, & and the line separators as unicode escapes, so content can never
 * close the script tag or break out of it.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const json = JSON.stringify(data).replace(/[<>&\u2028\u2029]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
