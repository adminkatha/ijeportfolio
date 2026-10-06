// First focusable element on every page; visible only when focused.
export function SkipLink({ href = "#main" }: { href?: string }) {
  return (
    <a
      href={href}
      className="label-mono fixed top-3 left-3 z-[100] -translate-y-[200%] bg-accent px-4 py-3 text-accent-ink transition-transform duration-(--dur-1) ease-out focus-visible:translate-y-0"
    >
      Skip to content
    </a>
  );
}
