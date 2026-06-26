import { describe, it, expect } from 'vitest'
import { validateCredentials } from '../../src/lib/auth/validate'

describe('validateCredentials', () => {
  it('rejects empty email', () => {
    expect(validateCredentials('', 'pw')).toMatch(/email/i)
  })
  it('rejects empty password', () => {
    expect(validateCredentials('a@b.com', '')).toMatch(/password/i)
  })
  it('accepts valid input', () => {
    expect(validateCredentials('a@b.com', 'pw')).toBeNull()
  })
})
