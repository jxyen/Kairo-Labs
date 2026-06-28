import type { NormalizedPaymentEvent, PaymentMethod } from '../normalize'
import type { PushPayload } from '../push-schema'

const APP_METHOD: Record<string, PaymentMethod> = {
  'com.venmo': 'venmo',
  'com.squareup.cash': 'cashapp',
  'com.zellepay.zelle': 'zelle',
}

function methodForApp(app: string): PaymentMethod {
  const direct = APP_METHOD[app]
  if (direct) return direct
  const a = app.toLowerCase()
  if (a.includes('venmo')) return 'venmo'
  if (a.includes('cash')) return 'cashapp'
  if (a.includes('zelle')) return 'zelle'
  throw new Error(`unknown payment app: ${app}`)
}

function parseAmount(text: string): number {
  const m = text.match(/\$\s?([0-9][0-9,]*(?:\.[0-9]{2})?)/)
  if (!m) throw new Error('no amount in notification')
  return Number(m[1].replace(/,/g, ''))
}

// Best-effort sender extraction: "<Name> paid you" or "from <Name>".
function parseSender(text: string): string | undefined {
  const paid = text.match(/^([A-Z][\w .'-]+?)\s+paid you\b/i)
  if (paid) return paid[1].trim()
  const from = text.match(/\bfrom\s+([A-Z$][\w .'-]+?)(?:[.!]|\s+for\b|\s+on\b|$)/i)
  return from ? from[1].trim() : undefined
}

export function parsePushNotification(payload: PushPayload): NormalizedPaymentEvent {
  const rawText = [payload.title, payload.text].filter(Boolean).join('\n')
  return {
    channel: 'push',
    method: methodForApp(payload.app),
    amount: parseAmount(rawText),
    sender: parseSender(payload.text || rawText),
    note: payload.text || undefined,
    rawText,
    receivedAt: payload.postedAt ?? new Date().toISOString(),
  }
}
