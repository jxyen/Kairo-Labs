# Ingestion adapters

Each adapter turns one detection channel's raw payload into a
`NormalizedPaymentEvent` (`../normalize.ts`). The webhook route for the channel
authenticates, validates the raw payload, calls the adapter, then
`toIngestPayload()` → `ingest_payment_event` RPC. The matching engine is
channel-agnostic, so adding a channel never touches the SQL.

## Current
- `push.ts` — Android push-notification forwarder. Input `PushPayload`
  (`{ app, title, text, postedAt? }`); maps package→method, parses amount + sender.
- `email.ts` — forwarded payment receipt email. Input `EmailPayload`
  (`{ from, subject, text, receivedAt?, messageId? }`); detects method by sender
  domain (Venmo/Cash App) or keyword (Zelle), and — because some banks (e.g.
  Navy Federal) send an incoming Zelle as a generic deposit alert with no
  "Zelle" keyword — also classifies a bank deposit alert (`BANK_DEPOSIT_SIGNALS`)
  as zelle. Parses amount + sender, uses `messageId` as `externalId`, and keeps
  `subject + body` as `rawText` so a `KL-` order code survives for the code-match
  path.

## Transports (how an email reaches the /email adapter)
The `email` channel is fed by two interchangeable transports; both end at
`parsePaymentEmail`, so a receipt is a first-class `email` event either way:
- **`/api/payments/ingest/email`** — a JSON `EmailPayload`, Bearer-authed. Used
  by a poll-based bridge (Gmail filter → Apps Script, every 1-5 min).
- **`/api/payments/ingest/postmark`** — Postmark inbound webhook. A Gmail filter
  auto-forwards the receipt to a Postmark inbound address; Postmark parses it and
  POSTs `PostmarkInbound` (`postmark-schema.ts`). This is the **instant** path
  (no poll, no expiring token). Authed by HTTP Basic or `?token=`, both compared
  to `PAYMENT_WEBHOOK_SECRET`.

## Adding a channel (e.g. email, Plaid)
1. Add `<channel>-schema.ts` (zod) for the raw payload.
2. Add `adapters/<channel>.ts` exporting
   `parse<Channel>(payload): NormalizedPaymentEvent` with `channel: '<channel>'`.
3. Add `src/app/api/payments/ingest/<channel>/route.ts` mirroring the push route
   (Bearer auth → validate → adapter → `toIngestPayload` → RPC).
4. Unit-test the adapter; the engine + DB tests already cover matching.
