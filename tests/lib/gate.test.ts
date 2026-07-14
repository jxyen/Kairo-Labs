import { describe, it, expect } from 'vitest'
import {
  GATE_COOKIE,
  GATE_COOKIE_VALUE,
  GATE_MAX_AGE_SECONDS,
  hasVerified,
  gateCookieString,
} from '@/lib/gate'

describe('gate constants', () => {
  it('uses the kairo_verified cookie with a one-year lifetime', () => {
    expect(GATE_COOKIE).toBe('kairo_verified')
    expect(GATE_COOKIE_VALUE).toBe('1')
    expect(GATE_MAX_AGE_SECONDS).toBe(31536000)
  })
})

describe('hasVerified', () => {
  it('is true only for the exact cookie value', () => {
    expect(hasVerified('1')).toBe(true)
  })

  it('is false when the cookie is missing or holds anything else', () => {
    expect(hasVerified(undefined)).toBe(false)
    expect(hasVerified('')).toBe(false)
    expect(hasVerified('0')).toBe(false)
    expect(hasVerified('true')).toBe(false)
  })
})

describe('gateCookieString', () => {
  it('builds a root-scoped, lax, one-year cookie', () => {
    expect(gateCookieString()).toBe(
      'kairo_verified=1; Max-Age=31536000; Path=/; SameSite=Lax',
    )
  })
})
