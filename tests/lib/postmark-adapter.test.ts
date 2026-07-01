import { describe, expect, it } from 'vitest'
import { postmarkInboundSchema, postmarkToEmailPayload } from '@/lib/payments/ingest/postmark-schema'
import { parsePaymentEmail } from '@/lib/payments/ingest/adapters/email'

// End-to-end of the transport: a Postmark inbound payload -> EmailPayload ->
// normalized event. Mirrors the three real receipts (Venmo / Cash App / Navy
// Federal-Zelle) forwarded through Postmark.
describe('postmarkToEmailPayload', () => {
  it('maps a Venmo receipt and preserves the order code for the code-match path', () => {
    const inbound = postmarkInboundSchema.parse({
      From: 'Venmo <venmo@venmo.com>',
      Subject: 'Jackson Orndorff paid $1.00 to your Venmo account.',
      TextBody: 'Jackson orndorff paid you $1.00\nKL-20260701-K7M2\nTransaction ID 1FR85291V55921640',
      MessageID: 'a1b2c3',
      Date: 'Tue, 30 Jun 2026 22:23:00 -0700',
    })
    const event = parsePaymentEmail(postmarkToEmailPayload(inbound))
    expect(event.method).toBe('venmo')
    expect(event.amount).toBe(1)
    expect(event.rawText).toContain('KL-20260701-K7M2')
    expect(event.externalId).toBe('a1b2c3')
    expect(event.receivedAt).toBe('2026-07-01T05:23:00.000Z')
  })

  it('maps a Cash App receipt', () => {
    const inbound = postmarkInboundSchema.parse({
      From: 'Cash App <cash@square.com>',
      Subject: 'You received $1.00',
      TextBody: 'Jackson Orndorff\nFor KL-20260701-K7M2\n+$1.00\nPayment received',
    })
    const event = parsePaymentEmail(postmarkToEmailPayload(inbound))
    expect(event.method).toBe('cashapp')
    expect(event.amount).toBe(1)
    expect(event.rawText).toContain('KL-20260701-K7M2')
  })

  it('maps a Navy Federal deposit (Zelle) receipt with no order code', () => {
    const inbound = postmarkInboundSchema.parse({
      From: 'Navy Federal Credit Union <alerts@navyfederal.org>',
      Subject: 'Your Funds Are Available',
      TextBody: '$1.00 was deposited into your Campus Checking account ending in 8159.',
    })
    const event = parsePaymentEmail(postmarkToEmailPayload(inbound))
    expect(event.method).toBe('zelle')
    expect(event.amount).toBe(1)
  })

  it('falls back to the HTML body when there is no text part', () => {
    const inbound = postmarkInboundSchema.parse({
      From: 'Venmo <venmo@venmo.com>',
      Subject: 'You received money',
      TextBody: '',
      HtmlBody: '<html><body><p>Sam paid you <b>$3.00</b></p><span>KL-20260701-ABCD</span></body></html>',
    })
    const payload = postmarkToEmailPayload(inbound)
    expect(payload.text).toContain('$3.00')
    const event = parsePaymentEmail(payload)
    expect(event.method).toBe('venmo')
    expect(event.amount).toBe(3)
    expect(event.rawText).toContain('KL-20260701-ABCD')
  })

  it('leaves receivedAt undefined when the Date header is unparseable', () => {
    const payload = postmarkToEmailPayload(
      postmarkInboundSchema.parse({ From: 'venmo@venmo.com', Subject: 'x', TextBody: 'paid you $1.00', Date: 'not-a-date' }),
    )
    expect(payload.receivedAt).toBeUndefined()
  })
})
