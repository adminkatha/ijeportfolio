import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { SkipLink } from "@/components/layout/SkipLink";
import { VercelInsights } from "@/components/layout/VercelInsights";
import { rootMetadata } from "@/lib/seo";
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

// Testing mount for the SEO agent (the site agent's layout replaces this at merge).
export const metadata: Metadata = rootMetadata;

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${GeistSans.variable} ${mono.variable}`}>
      <body>
        <SkipLink />
        {children}
        {/* Testing mount for the deploy agent: renders nothing unless VERCEL=1. */}
        <VercelInsights />
      </body>
    </html>
  );
}
