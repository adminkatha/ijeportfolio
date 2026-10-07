import type { Viewport } from "next";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import { ContactDialogHost } from "@/components/contact/ContactDialogHost";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SkipLink } from "@/components/layout/SkipLink";
import { VercelInsights } from "@/components/layout/VercelInsights";
import { MotionRoot } from "@/components/motion/MotionRoot";
import { MotionScript } from "@/components/motion/MotionScript";
import { disciplines } from "@/content/data/schema";
import { getContactConfig } from "@/lib/contact/config";
import { getProfile } from "@/lib/content";
import { rootMetadata } from "@/lib/seo";
import "./globals.css";

// Self-hosted at build time by next/font (no requests to Google from the browser),
// with size-adjusted fallbacks so the swap causes no layout shift. Licenses: public/fonts/LICENSES/.
// Only the display face is preloaded: the hero <h1> (the LCP element) needs it first. Body and mono text
// swap in from their adjusted fallbacks, which keeps ~110 KB of fonts off the critical path.
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
  preload: false,
});

// Geist from the geist package's own file (same as `geist/font/sans`, but not preloaded).
const sans = localFont({
  src: "../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
  preload: false,
});

export const metadata = rootMetadata;

/**
 * Applies the /work?d=… discipline filter before first paint (CSS hides the other rows), so a shared
 * filtered link never flashes the full list or shifts the layout. WorkFilter keeps it in step afterwards.
 */
const WORK_FILTER_BOOT = `(function(){try{if(location.pathname==="/work"){var d=new URLSearchParams(location.search).get("d");if(d&&${JSON.stringify(disciplines)}.indexOf(d)>-1)document.documentElement.setAttribute("data-work-filter",d)}}catch(e){}})();`;

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the head scripts set attributes on <html> before hydration
    // (MotionScript: the saved motion preference; WORK_FILTER_BOOT: the /work filter).
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <MotionScript />
        <script dangerouslySetInnerHTML={{ __html: WORK_FILTER_BOOT }} />
      </head>
      <body>
        <SkipLink />
        <Header />
        {children}
        <Footer />
        {/* The "Let’s connect" pop-up: nothing renders, and its code doesn't load, until it's first asked for. */}
        <ContactDialogHost email={getProfile().email} configured={Boolean(getContactConfig())} />
        <MotionRoot />
        <VercelInsights />
      </body>
    </html>
  );
}
