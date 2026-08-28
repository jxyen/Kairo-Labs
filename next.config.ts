import type { NextConfig } from "next";
import { POSTHOG_PROXY_PATH, resolvePosthogHosts } from "./src/lib/analytics/hosts";

const posthog = resolvePosthogHosts(process.env.NEXT_PUBLIC_POSTHOG_HOST);

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so a stray lockfile elsewhere
  // (e.g. ~/package-lock.json) doesn't get inferred as the root.
  turbopack: {
    root: __dirname,
  },

  // posthog-js POSTs to trailing-slash paths (/ingest/e/, /ingest/s/, …).
  // Next's automatic trailing-slash redirect would 308 every one of those, so
  // it's disabled here and re-applied for real site URLs in redirects() below,
  // keeping the SEO canonicalisation (/products/ → /products) unchanged.
  skipTrailingSlashRedirect: true,

  async redirects() {
    return [
      {
        source: "/:path((?!ingest(?:/|$)).*)/",
        destination: "/:path",
        permanent: true,
      },
    ];
  },

  // Same-origin reverse proxy for PostHog (see src/instrumentation-client.ts).
  // Static assets (recorder.js etc.) and the ingestion API live on different
  // PostHog origins; the /static prefix must be matched first.
  async rewrites() {
    return [
      {
        source: `${POSTHOG_PROXY_PATH}/static/:path*`,
        destination: `${posthog.assetsHost}/static/:path*`,
      },
      {
        source: `${POSTHOG_PROXY_PATH}/:path*`,
        destination: `${posthog.apiHost}/:path*`,
      },
    ];
  },
};

export default nextConfig;
