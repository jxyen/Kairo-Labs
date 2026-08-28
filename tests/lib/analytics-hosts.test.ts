import { describe, expect, it } from 'vitest'
import { POSTHOG_PROXY_PATH, resolvePosthogHosts } from '@/lib/analytics/hosts'

const US = {
  region: 'us',
  apiHost: 'https://us.i.posthog.com',
  assetsHost: 'https://us-assets.i.posthog.com',
  uiHost: 'https://us.posthog.com',
}
const EU = {
  region: 'eu',
  apiHost: 'https://eu.i.posthog.com',
  assetsHost: 'https://eu-assets.i.posthog.com',
  uiHost: 'https://eu.posthog.com',
}

describe('resolvePosthogHosts', () => {
  it('exposes the same-origin proxy path used by both next.config and the SDK init', () => {
    expect(POSTHOG_PROXY_PATH).toBe('/ingest')
  })

  it('defaults to US Cloud when the env var is unset or blank', () => {
    expect(resolvePosthogHosts(undefined)).toEqual(US)
    expect(resolvePosthogHosts(null)).toEqual(US)
    expect(resolvePosthogHosts('')).toEqual(US)
    expect(resolvePosthogHosts('   ')).toEqual(US)
  })

  it.each([
    'https://us.i.posthog.com',
    'https://us.i.posthog.com/',
    'https://us.posthog.com',
    'https://app.posthog.com',
    'us.i.posthog.com',
    'HTTPS://US.I.POSTHOG.COM',
  ])('maps any US-cloud spelling (%s) to the canonical ingestion/assets/UI hosts', (host) => {
    expect(resolvePosthogHosts(host)).toEqual(US)
  })

  it.each(['https://eu.i.posthog.com', 'https://eu.posthog.com', 'eu.i.posthog.com'])(
    'maps EU-cloud spellings (%s) to the EU hosts',
    (host) => {
      expect(resolvePosthogHosts(host)).toEqual(EU)
    },
  )

  it('forwards to a self-hosted PostHog origin as-is', () => {
    expect(resolvePosthogHosts('https://posthog.internal.example/')).toEqual({
      region: 'us',
      apiHost: 'https://posthog.internal.example',
      assetsHost: 'https://posthog.internal.example',
      uiHost: 'https://posthog.internal.example',
    })
  })

  it('does not throw on garbage and falls back to US', () => {
    expect(resolvePosthogHosts('http://')).toEqual(US)
    expect(resolvePosthogHosts('not a url at all')).toEqual(US)
  })
})
