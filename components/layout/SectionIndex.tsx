"use client";

import { useEffect, useState } from "react";
import { pad2 } from "@/components/ui/format";

type IndexItem = { id: string; title: string; number: number };

/**
 * The identity column's numbered section index. An IntersectionObserver watches the sections against the
 * top third of the viewport and marks the one being read (aria-current, accent number). No scroll listeners.
 */
export function SectionIndex({ sections }: { sections: IndexItem[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const targets = sections.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => el !== null);
    if (!targets.length) return;
    const inBand = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) inBand.add(e.target.id);
          else inBand.delete(e.target.id);
        }
        // The last section (in page order) that reaches into the top third is the one being read.
        let current: string | null = null;
        for (const s of sections) if (inBand.has(s.id)) current = s.id;
        setActive(current);
      },
      { rootMargin: "0px 0px -66% 0px" },
    );
    for (const t of targets) io.observe(t);
    return () => io.disconnect();
  }, [sections]);

  return (
    <ol className="mt-3">
      {sections.map((s) => {
        const on = s.id === active;
        return (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              aria-current={on ? "true" : undefined}
              className="label-mono group flex min-h-7 items-center gap-3 text-text-2 hover:text-text aria-[current]:text-text"
            >
              <span>
                <span aria-hidden="true">[</span>
                <span className={on ? "text-accent" : undefined}>{pad2(s.number)}</span>
                <span aria-hidden="true">]</span>
              </span>
              <span>{s.title}</span>
              <span
                aria-hidden="true"
                className={`h-px flex-1 origin-left bg-text-3 transition-[transform,opacity] duration-(--dur-2) ease-out ${on ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"}`}
              />
            </a>
          </li>
        );
      })}
    </ol>
  );
}
