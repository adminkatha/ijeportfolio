import type { ReactNode } from "react";
import { ColumnGuides } from "./ColumnGuides";

type PageHeaderProps = {
  /** Mono label above the title, e.g. "Index" or a discipline. */
  label: ReactNode;
  title: ReactNode;
  /** Short intro under the title. */
  children?: ReactNode;
  /** Extra content on the right of the label row (tags, meta). */
  aside?: ReactNode;
};

/** The top of an inner page: construction lines, a mono label, the page's one <h1>. */
export function PageHeader({ label, title, children, aside }: PageHeaderProps) {
  return (
    <header className="relative border-b border-line">
      <ColumnGuides span="page" className="absolute inset-x-0 top-0 h-full opacity-60" />
      <div className="container-site relative pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="label-mono flex flex-wrap items-center gap-x-4 gap-y-2 text-text-2">
          {label}
          {aside}
        </div>
        <h1 className="type-title mt-5 max-w-[18ch] text-[clamp(2.5rem,1.4rem+4.6vw,5.5rem)] uppercase">{title}</h1>
        {children ? <div className="mt-6 max-w-[60ch] text-lg text-text-2">{children}</div> : null}
      </div>
    </header>
  );
}
