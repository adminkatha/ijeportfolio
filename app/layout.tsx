import type { Viewport } from "next";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SkipLink } from "@/components/layout/SkipLink";
import { VercelInsights } from "@/components/layout/VercelInsights";
import { MotionRoot } from "@/components/motion/MotionRoot";
import { MotionScript } from "@/components/motion/MotionScript";
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

export const metadata = rootMetadata;

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: MotionScript sets the saved motion preference on <html> before hydration.
    <html lang="en" className={`${display.variable} ${GeistSans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <MotionScript />
      </head>
      <body>
        <SkipLink />
        <Header />
        {children}
        <Footer />
        <MotionRoot />
        <VercelInsights />
      </body>
    </html>
  );
}
