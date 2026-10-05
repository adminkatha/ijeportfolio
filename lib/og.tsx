import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/*
 * Open Graph cards (1200×630 PNG), generated at build time by the opengraph-image routes.
 * Dark and typographic, in the site's tokens: the title in Bricolage Grotesque, labels in JetBrains Mono,
 * hairline 12-column construction lines, and the accent only for the index number, the seam mark and the
 * "Sample campaign" tag.
 *
 * Fonts: static TTF cuts (ImageResponse can't read WOFF2) in lib/og-fonts/, instanced from the variable fonts
 * in the google/fonts repository (Bricolage Grotesque wght 700 / opsz 96; JetBrains Mono wght 400) and
 * subset to Latin. Both are SIL OFL 1.1: public/fonts/LICENSES/.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const COLOR = {
  bg: "#0A0A0B",
  line: "#232428",
  guide: "#141518",
  text: "#F4F4F2",
  text2: "#8B8D91",
  accent: "#C5F82A",
};
const DISPLAY = "Bricolage Grotesque";
const MONO = "JetBrains Mono";
const PAD_X = 64;
const PAD_Y = 56;

let fonts: Promise<NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"]> | undefined;
function loadFonts() {
  const dir = join(process.cwd(), "lib", "og-fonts");
  fonts ??= Promise.all([
    readFile(join(dir, "BricolageGrotesque-Bold.ttf")),
    readFile(join(dir, "JetBrainsMono-Regular.ttf")),
  ]).then(([display, mono]) => [
    { name: DISPLAY, data: display, weight: 700 as const, style: "normal" as const },
    { name: MONO, data: mono, weight: 400 as const, style: "normal" as const },
  ]);
  return fonts;
}

/** Display size that keeps the title to about three lines. */
function titleSize(title: string): number {
  const n = title.length;
  if (n <= 13) return 156;
  if (n <= 20) return 124;
  if (n <= 30) return 100;
  if (n <= 44) return 82;
  return 66;
}

export type OgCardInput = {
  /** Small mono label, top left (e.g. "Web & Systems"). */
  label: string;
  /** Optional index shown in accent before the label, like the site's section labels: "[01]". */
  index?: number;
  /** Top right (e.g. "Creative | Code"); ignored when `sample` is set. */
  corner?: string;
  /** The big title. */
  title: string;
  /** One line under the title. */
  subtitle?: string;
  /** Bottom left. */
  footer: string;
  /** Shows the "Sample campaign" tag. */
  sample?: boolean;
};

const mono = (size: number, color = COLOR.text2) =>
  ({
    fontFamily: MONO,
    fontSize: size,
    letterSpacing: size * 0.08,
    textTransform: "uppercase",
    color,
    lineHeight: 1.3,
  }) as const;

export async function renderOgCard({ label, index, corner, title, subtitle, footer, sample }: OgCardInput) {
  const size = titleSize(title);
  const contentWidth = OG_SIZE.width - PAD_X * 2;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: `${PAD_Y}px ${PAD_X}px`,
          backgroundColor: COLOR.bg,
          position: "relative",
        }}
      >
        {/* Construction lines: the 12-column grid, as on the site's CODE side. */}
        {Array.from({ length: 13 }, (_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: PAD_X + Math.round((contentWidth / 12) * i),
              width: 1,
              backgroundColor: COLOR.guide,
            }}
          />
        ))}

        {/* Top row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 20, borderBottom: `1px solid ${COLOR.line}` }}>
          <div style={{ display: "flex", ...mono(22) }}>
            {index !== undefined ? (
              <div style={{ display: "flex", marginRight: 18 }}>
                <span>[</span>
                <span style={{ color: COLOR.accent }}>{String(index).padStart(2, "0")}</span>
                <span>]</span>
              </div>
            ) : null}
            <span>{label}</span>
          </div>
          {sample ? (
            <div style={{ display: "flex", border: `2px solid ${COLOR.accent}`, padding: "6px 14px", ...mono(20, COLOR.accent) }}>Sample campaign</div>
          ) : corner ? (
            <div style={{ display: "flex", ...mono(22) }}>{corner}</div>
          ) : null}
        </div>

        {/* Title block */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: contentWidth }}>
          <div
            style={{
              display: "flex",
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: size,
              lineHeight: 0.92,
              letterSpacing: -0.04 * size,
              textTransform: "uppercase",
              color: COLOR.text,
            }}
          >
            {title}
          </div>
          {subtitle ? <div style={{ display: "flex", fontFamily: MONO, fontSize: 28, lineHeight: 1.35, color: COLOR.text2 }}>{subtitle}</div> : null}
        </div>

        {/* Bottom row: the footer and the seam mark */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 20, borderTop: `1px solid ${COLOR.line}` }}>
          <div style={{ display: "flex", ...mono(20) }}>{footer}</div>
          <div style={{ display: "flex", width: 6, height: 34, backgroundColor: COLOR.accent }} />
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await loadFonts() },
  );
}
