// Plain module (NOT 'use server'): zod schema + mapper for Postmark's inbound
// webhook. Postmark is only a TRANSPORT — a Gmail filter auto-forwards a payment
// receipt to a Postmark inbound address, Postmark parses it and POSTs this shape
// to /api/payments/ingest/postmark. We remap it onto the channel-agnostic
// EmailPayload and reuse the existing email adapter, so the receipt stays a
// first-class 'email' event no matter how it arrived.
import { z } from 'zod'
import type { EmailPayload } from './email-schema'

// Only the fields we consume. Postmark sends many more; unknown keys are ignored.
export const postmarkInboundSchema = z.object({
  From: z.string().default(''), // "Venmo <venmo@venmo.com>"
  Subject: z.string().default(''),
  TextBody: z.string().default(''),
  HtmlBody: z.string().default(''),
  MessageID: z.string().optional(), // Postmark's own id — stable per inbound email
  Date: z.string().optional(), // RFC 2822, e.g. "Tue, 30 Jun 2026 22:23:00 -0700"
})

export type PostmarkInbound = z.infer<typeof postmarkInboundSchema>

// Crude tag strip — only used when a receipt is HTML-only (no text part). We
// just need the visible text so the amount + KL order code survive.
function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function toIso(date: string | undefined): string | undefined {
  if (!date) return undefined
  const t = Date.parse(date)
  return Number.isNaN(t) ? undefined : new Date(t).toISOString()
}

export function postmarkToEmailPayload(p: PostmarkInbound): EmailPayload {
  return {
    from: p.From,
    subject: p.Subject,
    text: p.TextBody?.trim() ? p.TextBody : stripHtml(p.HtmlBody),
    receivedAt: toIso(p.Date),
    messageId: p.MessageID,
  }
}
