// Client-side instrumentation — runs once per full page load, after the HTML
// is parsed and before React hydrates (Next.js `instrumentation-client`
// convention). This is the ONLY place PostHog is initialised.
import posthog from 'posthog-js'
import { POSTHOG_PROXY_PATH, resolvePosthogHosts } from '@/lib/analytics/hosts'

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY

// Skip the admin: owner/staff clicks would pollute storefront funnels and
// recordings, and there's nothing to learn from watching ourselves.
const isAdmin = window.location.pathname.startsWith('/admin')

if (key && !isAdmin) {
  try {
    const hosts = resolvePosthogHosts(process.env.NEXT_PUBLIC_POSTHOG_HOST)
    posthog.init(key, {
      // Same-origin reverse proxy (see next.config.ts rewrites) — survives
      // tracker blockers that blocklist *.posthog.com.
      api_host: POSTHOG_PROXY_PATH,
      ui_host: hosts.uiHost,
      defaults: '2025-05-24',
      // App Router navigations don't reload the page; let the SDK hook
      // history changes so every route counts as a pageview.
      capture_pageview: 'history_change',
      capture_pageleave: true,
      // Only create person profiles once we identify (checkout email);
      // anonymous browsing stays anonymous and cheaper.
      person_profiles: 'identified_only',
      capture_exceptions: true,
      session_recording: {
        // Never record what visitors type (card/address/email fields).
        maskAllInputs: true,
      },
    })
  } catch {
    // Analytics must never break the storefront.
  }
}
