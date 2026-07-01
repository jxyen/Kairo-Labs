import { describe, expect, it } from 'vitest'
import { parsePaymentEmail } from '@/lib/payments/ingest/adapters/email'

describe('parsePaymentEmail', () => {
  it('parses a Venmo receipt email, carrying the order code in raw_text', () => {
    const e = parsePaymentEmail({
      from: 'Venmo <venmo@venmo.com>',
      subject: 'Jane Doe paid you $42.50',
      text: 'Jane Doe paid you $42.50\nNote: KL-20260628-AB23\nView in app',
      receivedAt: '2026-06-28T12:00:00.000Z',
      messageId: '<abc123@venmo.com>',
    })
    expect(e.channel).toBe('email')
    expect(e.method).toBe('venmo')
    expect(e.amount).toBe(42.5)
    expect(e.sender).toBe('Jane Doe')
    expect(e.rawText).toContain('KL-20260628-AB23')
    expect(e.externalId).toBe('<abc123@venmo.com>')
    expect(e.receivedAt).toBe('2026-06-28T12:00:00.000Z')
  })

  it('parses a Cash App receipt with a comma-grouped amount and reads the amount from the subject', () => {
    const e = parsePaymentEmail({
      from: 'Cash App <cash@square.com>',
      subject: 'You received $1,200.00',
      text: 'John Doe sent you $1,200.00',
    })
    expect(e.method).toBe('cashapp')
    expect(e.amount).toBe(1200)
    expect(e.sender).toBe('John Doe')
  })

  it('detects Zelle from a bank email body even when the from-domain is the bank', () => {
    const e = parsePaymentEmail({
      from: 'Chase <no.reply.alerts@chase.com>',
      subject: 'You received money with Zelle®',
      text: 'Alex Smith sent you $80.00 with Zelle.',
    })
    expect(e.method).toBe('zelle')
    expect(e.amount).toBe(80)
    expect(e.sender).toBe('Alex Smith')
  })

  it('detects Zelle from a bank deposit alert that never says "Zelle" (Navy Federal)', () => {
    // Navy Federal sends a generic "Deposit Confirmation" email for an incoming
    // Zelle — no "Zelle" keyword, no sender, no order code. It must still be
    // classified as zelle so the amount+method+window fallback can match it.
    const e = parsePaymentEmail({
      from: 'Navy Federal Credit Union <alerts@navyfederal.org>',
      subject: 'Your Funds Are Available',
      text:
        '$1.00 was deposited into your Campus Checking account ending in 8159. ' +
        'As of 07/01/26 at 02:05 AM ET the available balance is $1.80.',
    })
    expect(e.method).toBe('zelle')
    expect(e.amount).toBe(1)
  })

  it('detects a bank deposit alert as Zelle from the body alone (from-header rewritten by forwarding)', () => {
    // When Gmail auto-forwards, the From can be rewritten — detection must not
    // depend on the bank domain surviving in the from header.
    const e = parsePaymentEmail({
      from: 'me <jmontague2123@gmail.com>',
      subject: 'Fwd: Your Funds Are Available',
      text: '$25.00 was deposited into your Campus Checking account ending in 8159.',
    })
    expect(e.method).toBe('zelle')
    expect(e.amount).toBe(25)
  })

  it('falls back to a generated receivedAt when none is provided', () => {
    const e = parsePaymentEmail({
      from: 'venmo@venmo.com',
      subject: 'You received $5.00',
      text: 'Sam paid you $5.00',
    })
    expect(e.receivedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('throws on an unparseable amount', () => {
    expect(() =>
      parsePaymentEmail({ from: 'venmo@venmo.com', subject: 'hello', text: 'no money here' }),
    ).toThrow(/amount/i)
  })

  it('throws on an unrecognized payment source', () => {
    expect(() =>
      parsePaymentEmail({ from: 'newsletter@example.com', subject: 'sale', text: 'spend $1.00' }),
    ).toThrow(/unknown payment source/i)
  })
})
