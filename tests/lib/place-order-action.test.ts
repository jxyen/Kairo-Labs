import { describe, it, expect } from 'vitest'
import { placeOrderSchema } from '../../src/lib/orders/place-order-schema'

const base = {
  name: 'Jane', email: 'jane@example.com', method: 'cashapp',
  address: { line1: '1 St', city: 'X', state: 'CA', postal_code: '90001', country: 'US' },
  items: [{ size_id: '11111111-1111-1111-1111-111111111111', quantity: 2 }],
}

describe('placeOrderSchema', () => {
  it('accepts a valid order', () => {
    expect(placeOrderSchema.safeParse(base).success).toBe(true)
  })
  it('rejects a bad email and an empty cart', () => {
    expect(placeOrderSchema.safeParse({ ...base, email: 'nope' }).success).toBe(false)
    expect(placeOrderSchema.safeParse({ ...base, items: [] }).success).toBe(false)
  })
  it('rejects an unknown payment method', () => {
    expect(placeOrderSchema.safeParse({ ...base, method: 'bitcoinz' }).success).toBe(false)
  })
})
