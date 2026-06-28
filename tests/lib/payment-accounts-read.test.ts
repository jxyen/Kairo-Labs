import { describe, it, expect } from 'vitest'
import { getActivePaymentAccounts, getPaymentAccountForMethod } from '../../src/lib/payments/accounts'

describe('payment accounts read layer', () => {
  it('returns the seeded active methods, sorted', async () => {
    const accts = await getActivePaymentAccounts()
    expect(accts.map((a) => a.method)).toEqual(['zelle', 'cashapp', 'venmo'])
  })
  it('looks up one method', async () => {
    const a = await getPaymentAccountForMethod('cashapp')
    expect(a?.method).toBe('cashapp')
    expect(typeof a?.handle).toBe('string')
  })
})
