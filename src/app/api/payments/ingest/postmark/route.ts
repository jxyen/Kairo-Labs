import { timingSafeEqual } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/lib/supabase/database.types'
import { postmarkInboundSchema, postmarkToEmailPayload } from '@/lib/payments/ingest/postmark-schema'
import { parsePaymentEmail } from '@/lib/payments/ingest/adapters/email'
import { toIngestPayload } from '@/lib/payments/ingest/normalize'

export const dynamic = 'force-dynamic'

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

// Postmark cannot send a custom "Authorization: Bearer" header, so the inbound
// webhook is authenticated two ways, either of which is accepted:
//   - HTTP Basic auth  (Postmark's webhook UI: username = anything, password = secret)
//   - a ?token= query param on the webhook URL
// Both are compared, constant-time, against PAYMENT_WEBHOOK_SECRET (the same
// secret the /email route uses).
function authorize(request: Request): boolean {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET
  if (!secret) throw new Error('PAYMENT_WEBHOOK_SECRET is not set')

  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  if (token && safeEqual(token, secret)) return true

  const auth = request.headers.get('authorization') ?? ''
  if (auth.startsWith('Basic ')) {
    const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf8')
    const password = decoded.slice(decoded.indexOf(':') + 1)
    if (safeEqual(password, secret)) return true
  }
  return false
}

export async function POST(request: Request) {
  let ok: boolean
  try {
    ok = authorize(request)
  } catch {
    return Response.json({ error: 'server misconfigured' }, { status: 500 })
  }
  if (!ok) return Response.json({ error: 'unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 })
  }

  const parsed = postmarkInboundSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'invalid payload' }, { status: 400 })

  let event
  try {
    event = parsePaymentEmail(postmarkToEmailPayload(parsed.data))
  } catch (e) {
    // Not a payment receipt we recognize (e.g. a forwarded non-receipt). Return
    // 200 so Postmark treats it as handled and does not retry.
    return Response.json({ status: 'ignored', reason: (e as Error).message })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('ingest_payment_event', {
    p_payload: toIngestPayload(event) as Json,
  })
  if (error) return Response.json({ error: error.message }, { status: 500 })

  const result = data as { status: string; order_number: string | null }
  return Response.json({ status: result.status, orderNumber: result.order_number })
}
