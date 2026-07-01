import type { NormalizedPaymentEvent, PaymentMethod } from '../normalize'
import type { EmailPayload } from '../email-schema'

// Method detection: prefer the sender domain (most reliable), then fall back to
// a keyword anywhere in from/subject/body. Zelle has no single domain — it
// arrives from the customer's bank — so it is keyword-only.
const DOMAIN_METHOD: Array<{ re: RegExp; method: PaymentMethod }> = [
  { re: /venmo\.com/i, method: 'venmo' },
  { re: /(cash\.app|squareup\.com|square\.com)/i, method: 'cashapp' },
]

// Zelle is the hard case: some banks (e.g. Navy Federal) never send a
// "Zelle" receipt at all — an incoming Zelle just fires a generic deposit
// alert with no sender, no memo, and no "Zelle" keyword. Treat such a bank
// deposit alert as zelle so the amount+method+window fallback can match it.
// These signals are intentionally deposit-specific (not just "deposited")
// and are checked LAST, after the Venmo/Cash App keywords, so a Venmo/Cash
// App email is never misread. Tune this list to the receiving bank(s).
const BANK_DEPOSIT_SIGNALS: RegExp[] = [
  /navy\s*federal/i,
  /your funds are available/i,
  /deposit confirmation/i,
  /was deposited into your\b/i,
]

function methodForEmail(from: string, haystack: string): PaymentMethod {
  for (const { re, method } of DOMAIN_METHOD) {
    if (re.test(from)) return method
  }
  const h = haystack.toLowerCase()
  if (h.includes('venmo')) return 'venmo'
  if (h.includes('cash app') || h.includes('cashapp') || h.includes('cash.app')) return 'cashapp'
  if (h.includes('zelle')) return 'zelle'
  if (BANK_DEPOSIT_SIGNALS.some((re) => re.test(haystack))) return 'zelle'
  throw new Error(`unknown payment source: ${from}`)
}

function parseAmount(...texts: string[]): number {
  for (const t of texts) {
    const m = t.match(/\$\s?([0-9][0-9,]*(?:\.[0-9]{2})?)/)
    if (m) return Number(m[1].replace(/,/g, ''))
  }
  throw new Error('no amount in email')
}

// Best-effort sender extraction across subject + body:
// "<Name> paid you" (Venmo), "<Name> sent you" (Cash App / Zelle), "from <Name>".
function parseSender(...texts: string[]): string | undefined {
  for (const t of texts) {
    const action = t.match(/^([A-Z][\w .'-]+?)\s+(?:paid|sent)\s+you\b/im)
    if (action) return action[1].trim()
  }
  for (const t of texts) {
    const from = t.match(/\bfrom\s+([A-Z$][\w .'-]+?)(?:[.!]|\s+for\b|\s+on\b|\s+with\b|$)/m)
    if (from) return from[1].trim()
  }
  return undefined
}

export function parsePaymentEmail(payload: EmailPayload): NormalizedPaymentEvent {
  const subject = payload.subject || ''
  const text = payload.text || ''
  const rawText = [subject, text].filter(Boolean).join('\n')
  return {
    channel: 'email',
    method: methodForEmail(payload.from, `${payload.from}\n${rawText}`),
    amount: parseAmount(subject, text),
    sender: parseSender(subject, text),
    note: text || undefined,
    rawText,
    externalId: payload.messageId || undefined,
    receivedAt: payload.receivedAt ?? new Date().toISOString(),
  }
}
