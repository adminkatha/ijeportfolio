"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { attachSeam } from "./controller";
import { SEAM_MAX, SEAM_MIN, SEAM_REST, seamValueText } from "./seam";
import s from "./HeroSeam.module.css";

export type HeroSeamProps = {
  name: string;
  title: string;
  roleLine: string;
  cta: { label: string; href: string };
};

/*
 * The token values the CODE layer prints. These are only the server-rendered fallbacks:
 * on mount they are replaced with the live values of the same custom properties in
 * app/globals.css, and tests/e2e/seam.test.mjs checks the two agree.
 */
const TOKENS = {
  "--text-display": "clamp(3.25rem, 2rem + 6vw, 8.5rem)",
  "--text-display--line-height": "0.92",
  "--text-display--letter-spacing": "-0.04em",
  "--gutter": "24px",
  "--site-max": "1280px",
} as const;
type TokenName = keyof typeof TOKENS;

const COLUMNS = Array.from({ length: 12 }, (_, i) => i);

/** "-.04em" → "-0.04em", "clamp(3.25rem,2rem + 6vw,8.5rem)" → "clamp(3.25rem, 2rem + 6vw, 8.5rem)". */
const formatToken = (v: string) =>
  v
    .trim()
    .replace(/,(?=\S)/g, ", ")
    .replace(/(^|[^\d.])\.(\d)/g, "$10.$2");

const px = (v: number) => `${Math.round(v * 10) / 10}px`;

/** The role line's print highlight goes on the word "ads" (the creative half of the sentence). */
function splitHighlight(text: string): [string, string, string] | null {
  const m = /\bads\b/i.exec(text);
  return m ? [text.slice(0, m.index), m[0], text.slice(m.index + m[0].length)] : null;
}

/** "See the work →" → the words, plus the arrow kept out of the accessible name. */
function CtaLabel({ label }: { label: string }) {
  const m = /^(.*?)\s*(→)$/.exec(label);
  if (!m) return <>{label}</>;
  return (
    <>
      {m[1]}&nbsp;<span aria-hidden="true">{m[2]}</span>
    </>
  );
}

/** An annotation that fades in during the intro; `i` staggers it. */
const annot = (i: number) => ({ "--i": i }) as CSSProperties;

function Token({ name }: { name: TokenName }) {
  return <b data-token={name}>{TOKENS[name]}</b>;
}

function Measure({ name }: { name: string }) {
  return <b data-measure={name} />;
}

/**
 * The CREATIVE | CODE hero: one client component, two full-size stacked layers of the same headline,
 * each clipped with clip-path from one `--seam` custom property (percent of the hero's width).
 * The CREATIVE layer holds the page's only <h1>; the CODE layer is aria-hidden.
 */
export function HeroSeam({ name, title, roleLine, cta }: HeroSeamProps) {
  const rootRef = useRef<HTMLElement>(null);
  const knobRef = useRef<HTMLSpanElement>(null);
  const [view, setView] = useState<"creative" | "code">("creative");
  const parts = splitHighlight(roleLine);

  // Same words and boxes on both layers; only the CODE copy carries the tag note.
  const role = (notes: boolean) =>
    parts ? (
      <>
        {parts[0]}
        <mark className={s.mark}>
          {parts[1]}
          {notes ? (
            <span className={`${s.note} ${s.tag}`} data-annot="" style={annot(5)}>
              mark
            </span>
          ) : null}
        </mark>
        {parts[2]}
      </>
    ) : (
      roleLine
    );

  // Pointer, drag, keys, modes and the rest of the intro (components/hero/controller.ts).
  useEffect(() => {
    const root = rootRef.current;
    const knob = knobRef.current;
    if (!root || !knob) return;
    return attachSeam(root, knob);
  }, []);

  // Print the live token values and the measured sizes into the CODE layer.
  useEffect(() => {
    const root = rootRef.current;
    const h1 = root?.querySelector("h1");
    const frame = root?.querySelector<HTMLElement>(`.${s.code} .${s.frame}`);
    if (!root || !h1 || !frame) return;
    const write = (selector: string, text: string) => {
      root.querySelectorAll<HTMLElement>(selector).forEach((el) => {
        if (el.textContent !== text) el.textContent = text;
      });
    };
    const fill = () => {
      const tokens = getComputedStyle(document.documentElement);
      for (const name of Object.keys(TOKENS) as TokenName[]) {
        const live = tokens.getPropertyValue(name);
        if (live.trim()) write(`[data-token="${name}"]`, formatToken(live));
      }
      const type = getComputedStyle(h1);
      write('[data-measure="font-size"]', px(parseFloat(type.fontSize)));
      write('[data-measure="line-height"]', px(parseFloat(type.lineHeight)));
      write('[data-measure="letter-spacing"]', px(parseFloat(type.letterSpacing)));
      // The frame's measured width, shown only while it is narrower than the max-width token.
      const frameStyle = getComputedStyle(frame);
      const content = frame.clientWidth - parseFloat(frameStyle.paddingLeft) - parseFloat(frameStyle.paddingRight);
      const max = parseFloat(tokens.getPropertyValue("--site-max"));
      write('[data-measure="frame"]', content < max - 0.5 ? ` · ${px(content)}` : "");
      write('[data-measure="hero"]', `${Math.round(root.offsetWidth)} × ${Math.round(root.offsetHeight)}`);
    };
    fill();
    const ro = new ResizeObserver(fill);
    ro.observe(root);
    return () => ro.disconnect();
  }, []);

  return (
    <section ref={rootRef} className={s.hero} data-view={view} aria-labelledby="hero-title">
      <div className={s.stage}>
        {/* CREATIVE: the finished ad. */}
        <div className={`${s.layer} ${s.creative}`}>
          <div className={`container-site ${s.frame}`}>
            <div className={s.trim} aria-hidden="true">
              <span className={`${s.crop} ${s.tl}`} />
              <span className={`${s.crop} ${s.tr}`} />
              <span className={`${s.crop} ${s.bl}`} />
              <span className={`${s.crop} ${s.br}`} />
              <span className={`${s.reg} ${s.regL}`} />
              <span className={`${s.reg} ${s.regR}`} />
            </div>
            <p className={`label-mono ${s.eyebrow}`}>{title}</p>
            <h1 id="hero-title" className={`type-display ${s.name}`}>
              {name}
            </h1>
            <div className={s.deck}>
              <p className={s.role}>{role(false)}</p>
              <a href={cta.href} data-event="hero_cta" className={`label-mono ${s.cta}`}>
                <CtaLabel label={cta.label} />
              </a>
            </div>
          </div>
        </div>

        {/* CODE: the same headline as its code and structure (decorative, hidden from assistive tech). */}
        <div className={`${s.layer} ${s.code}`} aria-hidden="true">
          <div className={`container-site grid-12 ${s.guides}`}>
            {COLUMNS.map((i) => (
              <span key={i}>
                {i === 10 ? (
                  <span className={`${s.note} ${s.gap}`} data-annot="" style={annot(6)}>
                    gap <Token name="--gutter" />
                  </span>
                ) : null}
              </span>
            ))}
          </div>
          <div className={`container-site ${s.frame}`}>
            <div className={`${s.note} ${s.dimFrame}`} data-annot="" style={annot(0)}>
              <span>
                max-width <Token name="--site-max" />
                <Measure name="frame" />
              </span>
            </div>
            <p className={`label-mono ${s.eyebrow}`}>
              {title}
              <span className={`${s.note} ${s.tag}`} data-annot="" style={annot(1)}>
                p.label-mono
              </span>
            </p>
            <div className={`type-display ${s.name}`}>
              {name}
              <span className={`${s.note} ${s.tag}`} data-annot="" style={annot(2)}>
                h1.type-display
              </span>
              <span className={`${s.note} ${s.specSize}`} data-annot="" style={annot(2)}>
                font-size: <Token name="--text-display" /> <i>= </i>
                <Measure name="font-size" />
              </span>
              <span className={`${s.note} ${s.dimLine}`} data-annot="" style={annot(3)}>
                <span>
                  line-height <Token name="--text-display--line-height" /> <i>= </i>
                  <Measure name="line-height" />
                </span>
              </span>
              <span className={`${s.note} ${s.specTrack}`} data-annot="" style={annot(4)}>
                letter-spacing: <Token name="--text-display--letter-spacing" /> <i>= </i>
                <Measure name="letter-spacing" />
              </span>
            </div>
            <div className={s.deck}>
              <p className={s.role}>
                {role(true)}
                <span className={`${s.note} ${s.tag}`} data-annot="" style={annot(5)}>
                  p.role
                </span>
              </p>
              <a href={cta.href} tabIndex={-1} className={`label-mono ${s.cta}`}>
                <CtaLabel label={cta.label} />
                <span className={`${s.note} ${s.tag} ${s.tagCta}`} data-annot="" style={annot(6)}>
                  {`<a href="${cta.href}" data-event="hero_cta">`}
                </span>
              </a>
            </div>
            <pre className={`${s.note} ${s.source}`} data-annot="" style={annot(7)}>
              <code>
                <i>{"// components/hero/HeroSeam.tsx"}</i>
                {"\n"}
                {"<h1 "}
                <em>className</em>
                {'="type-display">\n  {name}\n</h1>\n<p>{roleLine}</p>\n<a '}
                <em>href</em>
                {`="${cta.href}" `}
                <em>data-event</em>
                {'="hero_cta">\n  {cta.label}\n</a>'}
              </code>
            </pre>
            <span className={`${s.note} ${s.size}`} data-annot="" style={annot(8)}>
              section <Measure name="hero" />
            </span>
          </div>
        </div>

        {/* The seam itself: a full-width rail translated to --seam (transform only), carrying the handle. */}
        <div className={s.rail}>
          <span className={s.line} aria-hidden="true" />
          <span className={`label-mono ${s.side} ${s.sideCreative}`} aria-hidden="true">
            Creative
          </span>
          <span className={`label-mono ${s.side} ${s.sideCode}`} aria-hidden="true">
            Code
          </span>
          <span
            ref={knobRef}
            className={s.knob}
            role="slider"
            tabIndex={0}
            aria-label="Creative / Code seam"
            aria-orientation="horizontal"
            aria-valuemin={SEAM_MIN}
            aria-valuemax={SEAM_MAX}
            aria-valuenow={SEAM_REST}
            aria-valuetext={seamValueText(SEAM_REST)}
          />
        </div>
      </div>

      {/* Under 768px a half-and-half headline is unreadable, so the two views take turns. */}
      <div className={s.toggle} role="group" aria-label="Hero view">
        <button type="button" className="label-mono" aria-pressed={view === "creative"} onClick={() => setView("creative")}>
          Creative
        </button>
        <button type="button" className="label-mono" aria-pressed={view === "code"} onClick={() => setView("code")}>
          Code
        </button>
      </div>
    </section>
  );
}
