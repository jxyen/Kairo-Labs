import { describe, expect, it } from 'vitest'
import { displayHandle, paymentDeepLink } from '@/lib/payments/payment-links'

describe('paymentDeepLink', () => {
  it('builds a Cash App cashtag link and normalizes a leading $', () => {
    expect(paymentDeepLink('cashapp', '$KairoLabs')).toBe('https://cash.app/$KairoLabs')
    expect(paymentDeepLink('cashapp', 'KairoLabs')).toBe('https://cash.app/$KairoLabs')
  })

  it('prefills the Cash App amount when provided', () => {
    expect(paymentDeepLink('cashapp', '$KairoLabs', 42.5)).toBe('https://cash.app/$KairoLabs/42.50')
  })

  it('builds a Venmo profile link and strips a leading @', () => {
    expect(paymentDeepLink('venmo', '@kairo')).toBe('https://venmo.com/u/kairo')
    expect(paymentDeepLink('venmo', 'kairo')).toBe('https://venmo.com/u/kairo')
  })

  it('does not prefill an amount for Venmo', () => {
    expect(paymentDeepLink('venmo', 'kairo', 42.5)).toBe('https://venmo.com/u/kairo')
  })

  it('returns null for Zelle (no public link format)', () => {
    expect(paymentDeepLink('zelle', 'pay@kairolabs.org')).toBeNull()
  })

  it('returns null for an empty, whitespace, or bare-symbol handle', () => {
    expect(paymentDeepLink('cashapp', '')).toBeNull()
    expect(paymentDeepLink('venmo', '   ')).toBeNull()
    expect(paymentDeepLink('cashapp', '$')).toBeNull()
  })

  it('strips the other platform’s prefix — an owner typing @ for Cash App still gets a live link', () => {
    expect(paymentDeepLink('cashapp', '@kairolabs')).toBe('https://cash.app/$kairolabs')
    expect(paymentDeepLink('venmo', '$kairolabs')).toBe('https://venmo.com/u/kairolabs')
  })

  it('returns null rather than a broken link when the handle is not a valid username', () => {
    expect(paymentDeepLink('cashapp', 'kairo labs')).toBeNull()
    expect(paymentDeepLink('cashapp', 'kairo/labs?x=1')).toBeNull()
    expect(paymentDeepLink('venmo', 'pay@kairolabs.org')).toBeNull()
  })
})

describe('displayHandle', () => {
  it('shows the platform-correct prefix regardless of how the owner typed it', () => {
    expect(displayHandle('cashapp', '@kairolabs')).toBe('$kairolabs')
    expect(displayHandle('cashapp', 'kairolabs')).toBe('$kairolabs')
    expect(displayHandle('venmo', '$kairolabs')).toBe('@kairolabs')
  })

  it('leaves a Zelle handle alone — it is an email or phone, not a username', () => {
    expect(displayHandle('zelle', 'pay@kairolabs.org')).toBe('pay@kairolabs.org')
  })

  it('returns null for an empty handle', () => {
    expect(displayHandle('cashapp', '  ')).toBeNull()
    expect(displayHandle('zelle', null)).toBeNull()
  })
})
