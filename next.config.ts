import type { NextConfig } from "next";
import { withContentCollections } from "@content-collections/next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Next 16 requires an allow-list of qualities.
    qualities: [75, 82],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        // Live dashboard demos: sample data, never indexed (each page also has <meta name="robots" content="noindex">).
        source: "/demos/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          // The demos run in a sandboxed iframe (an opaque origin), so their self-hosted fonts are cross-origin
          // requests. These are public static files.
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
};

export default withContentCollections(nextConfig);
