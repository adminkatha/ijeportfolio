import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { TrackEvents } from "./TrackEvents";

/**
 * Vercel Analytics + Speed Insights (render once, in the root layout's <body>). Only on Vercel builds, and each
 * only once it's switched on: Vercel serves their scripts from /_vercel/… only after the product is enabled in the
 * dashboard (before that they 404). So: enable it in Vercel, then set ENABLE_VERCEL_ANALYTICS=1 and/or
 * ENABLE_SPEED_INSIGHTS=1 and redeploy (docs/DEPLOY.md §5). With Analytics on, clicks on [data-event] elements
 * become custom events.
 */
export function VercelInsights() {
  if (process.env.VERCEL !== "1") return null;
  const analytics = process.env.ENABLE_VERCEL_ANALYTICS === "1";
  const speedInsights = process.env.ENABLE_SPEED_INSIGHTS === "1";
  if (!analytics && !speedInsights) return null;
  return (
    <>
      {analytics ? (
        <>
          <Analytics />
          <TrackEvents />
        </>
      ) : null}
      {speedInsights ? <SpeedInsights /> : null}
    </>
  );
}
