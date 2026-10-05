import type { Metadata } from "next";
import "./globals.css";

// Phase 0 placeholder. Real metadata comes from content/data in Phase 2 and Phase 10.
export const metadata: Metadata = {
  title: "Portfolio (in progress)",
  description: "Portfolio scaffold. Content arrives in later phases.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
