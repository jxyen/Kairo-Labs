// PostHog host resolution — shared by next.config.ts (reverse-proxy rewrites)
// and instrumentation-client.ts (SDK init). Pure; no browser or Node APIs.
//
// The browser never talks to *.posthog.com directly. Everything goes through
// a same-origin path (`/ingest/...`) that next.config rewrites to PostHog, so
// ad/tracker blockers that blocklist posthog.com don't silently drop sessions
// and recordings. `NEXT_PUBLIC_POSTHOG_HOST` only tells us WHICH PostHog
// region to forward to; the exact form of the value (`us.i.posthog.com`,
// `us.posthog.com`, `app.posthog.com`…) doesn't matter.

export const POSTHOG_PROXY_PATH = '/ingest'

export type PosthogRegion = 'us' | 'eu'

export interface PosthogHosts {
  region: PosthogRegion
  /** Ingestion API origin the proxy forwards events to. */
  apiHost: string
  /** Static-asset origin (recorder.js etc.) the proxy forwards `/static/*` to. */
  assetsHost: string
  /** Where the SDK links the toolbar / UI. */
  uiHost: string
}

function isPosthogCloud(hostname: string): boolean {
  return /(^|\.)posthog\.com$/.test(hostname)
}

function parse(raw: string): URL | null {
  if (!raw) return null
  try {
    return new URL(raw.includes('://') ? raw : `https://${raw}`)
  } catch {
    return null
  }
}

function looksLikeHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname.includes('.')
}

export function resolvePosthogHosts(envHost?: string | null): PosthogHosts {
  const raw = (envHost ?? '').trim()
  // PostHog's own Next.js proxy guide has people set NEXT_PUBLIC_POSTHOG_HOST
  // to the proxy PATH ("/ingest") — that is what's on Vercel prod. A path is
  // not a host: ignore it (and anything else without a real hostname) and use
  // the cloud default rather than proxying to a domain that doesn't exist.
  const url = raw.startsWith('/') ? null : parse(raw)
  const hostname = url?.hostname.toLowerCase() ?? ''

  // Self-hosted / unknown host: forward everything to that origin as-is.
  if (url && looksLikeHostname(hostname) && !isPosthogCloud(hostname)) {
    const origin = url.origin
    return { region: 'us', apiHost: origin, assetsHost: origin, uiHost: origin }
  }

  const region: PosthogRegion = /^eu[.-]/.test(hostname) ? 'eu' : 'us'
  return {
    region,
    apiHost: `https://${region}.i.posthog.com`,
    assetsHost: `https://${region}-assets.i.posthog.com`,
    uiHost: `https://${region}.posthog.com`,
  }
}
