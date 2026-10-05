import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { SkipLink } from "@/components/layout/SkipLink";
import { MotionScript } from "@/components/motion/MotionScript";
import "./globals.css";

// Self-hosted at build time by next/font (no requests to Google from the browser),
// with size-adjusted fallbacks so the swap causes no layout shift. Licenses: public/fonts/LICENSES/.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-bricolage",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// Phase 1 placeholder. Real metadata comes from content/data (Phase 2) and lib/seo (Phase 10).
export const metadata: Metadata = {
  title: "Ehjay Lorenzo (in progress)",
  description: "Portfolio in progress.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${GeistSans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <MotionScript />
      </head>
      <body>
        <SkipLink />
        {children}
      </body>
    </html>
  );
}
