import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { TrackEvents } from "./TrackEvents";

/**
 * Vercel Analytics + Speed Insights (render once, in the root layout's <body>).
 * Only on Vercel builds: their scripts are served from /_vercel/… by Vercel and would 404 anywhere else.
 * Turn both on in the Vercel dashboard too (docs/DEPLOY.md). Clicks on [data-event] elements become custom events.
 */
export function VercelInsights() {
  if (process.env.VERCEL !== "1") return null;
  return (
    <>
      <Analytics />
      <SpeedInsights />
      <TrackEvents />
    </>
  );
}
