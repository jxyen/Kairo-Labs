import { describe, expect, it } from 'vitest'
import { parsePushNotification } from '@/lib/payments/ingest/adapters/push'

describe('parsePushNotification', () => {
  it('parses a Venmo payment with a memo carrying the order code', () => {
    const e = parsePushNotification({
      app: 'com.venmo', title: 'Venmo',
      text: 'Jane Doe paid you $42.50 - KL-20260628-AB23', postedAt: '2026-06-28T12:00:00.000Z',
    })
    expect(e.method).toBe('venmo')
    expect(e.amount).toBe(42.5)
    expect(e.sender).toBe('Jane Doe')
    expect(e.rawText).toContain('KL-20260628-AB23')
    expect(e.receivedAt).toBe('2026-06-28T12:00:00.000Z')
  })

  it('parses a Cash App payment and a comma-grouped amount', () => {
    const e = parsePushNotification({
      app: 'com.squareup.cash', title: 'Cash App', text: 'You received $1,200.00 from $johndoe',
    })
    expect(e.method).toBe('cashapp')
    expect(e.amount).toBe(1200)
  })

  it('maps a Zelle-style app name', () => {
    const e = parsePushNotification({
      app: 'com.zellepay.zelle', title: 'Zelle', text: 'You received $80.00 from ALEX',
    })
    expect(e.method).toBe('zelle')
    expect(e.amount).toBe(80)
  })

  it('throws on an unparseable amount', () => {
    expect(() => parsePushNotification({ app: 'com.venmo', title: 'Venmo', text: 'no money here' }))
      .toThrow(/amount/i)
  })

  it('throws on an unknown app', () => {
    expect(() => parsePushNotification({ app: 'com.whatsapp', title: 'x', text: '$1.00' }))
      .toThrow(/unknown payment app/i)
  })
})
