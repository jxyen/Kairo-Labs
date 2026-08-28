// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('posthog-js', () => ({
  default: { __loaded: false, capture: vi.fn(), identify: vi.fn() },
}))

import posthog from 'posthog-js'
import { identify, track } from '@/lib/analytics/track'

const ph = posthog as unknown as {
  __loaded: boolean
  capture: ReturnType<typeof vi.fn>
  identify: ReturnType<typeof vi.fn>
}

beforeEach(() => {
  ph.__loaded = false
  ph.capture.mockReset()
  ph.identify.mockReset()
})

describe('track / identify', () => {
  it('are silent no-ops before PostHog has initialised (tests, /admin, missing key)', () => {
    track('order_placed', { order_number: 'KL-1' })
    identify('someone@example.com')
    expect(ph.capture).not.toHaveBeenCalled()
    expect(ph.identify).not.toHaveBeenCalled()
  })

  it('forward to posthog once it is loaded', () => {
    ph.__loaded = true
    track('order_placed', { order_number: 'KL-1', total: 50.76 })
    identify('  Someone@example.com ', { email: 'Someone@example.com' })
    expect(ph.capture).toHaveBeenCalledWith('order_placed', { order_number: 'KL-1', total: 50.76 })
    expect(ph.identify).toHaveBeenCalledWith('Someone@example.com', { email: 'Someone@example.com' })
  })

  it('never identifies with an empty id', () => {
    ph.__loaded = true
    identify('   ')
    expect(ph.identify).not.toHaveBeenCalled()
  })

  it('swallow SDK errors so analytics can never break the storefront', () => {
    ph.__loaded = true
    ph.capture.mockImplementation(() => {
      throw new Error('boom')
    })
    ph.identify.mockImplementation(() => {
      throw new Error('boom')
    })
    expect(() => track('x')).not.toThrow()
    expect(() => identify('y')).not.toThrow()
  })
})
