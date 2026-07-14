// Plain module: builds the public "pay me" deep link for a payment account,
// used to auto-generate a scannable QR on the order pay page.
import type { Database } from '@/lib/supabase/database.types'

export type PaymentMethod = Database['public']['Enums']['payment_method']

// Cash App cashtags and Venmo usernames are both bare usernames — the $ / @ is
// display sugar, not part of the identifier. Owners type them either way (or
// paste the wrong platform's prefix), so strip any leading sigil and validate
// what's left. Anything that isn't a plausible username yields no link at all:
// a QR that scans to a dead page is worse than no QR.
const CASHTAG = /^[A-Za-z0-9_]{1,20}$/
const VENMO_USERNAME = /^[A-Za-z0-9_-]{3,30}$/

function bareUsername(handle: string | null | undefined): string {
  return (handle ?? '').trim().replace(/^[$@]+/, '').trim()
}

/**
 * A link the customer can scan/tap to reach the destination account.
 * - Cash App and Venmo have public link formats.
 * - Zelle has none (its QR is generated inside the customer's bank app), so it
 *   returns null — Zelle stays handle-as-text or a manually uploaded image.
 * `amount` (the order total) is prefilled for Cash App, which supports it;
 * Venmo's scan links don't reliably honor a prefilled amount, so it's omitted.
 */
export function paymentDeepLink(
  method: PaymentMethod,
  handle: string | null | undefined,
  amount?: number,
): string | null {
  const name = bareUsername(handle)
  if (!name) return null

  switch (method) {
    case 'cashapp': {
      if (!CASHTAG.test(name)) return null
      const amt = amount != null && amount > 0 ? `/${amount.toFixed(2)}` : ''
      return `https://cash.app/$${name}${amt}`
    }
    case 'venmo': {
      if (!VENMO_USERNAME.test(name)) return null
      return `https://venmo.com/u/${name}`
    }
    default:
      return null
  }
}

/**
 * How the handle should read to a customer: `$cashtag` for Cash App, `@username`
 * for Venmo, verbatim for Zelle (an email or phone, not a username). Keeps the
 * pay page honest when the owner typed the wrong sigil in admin.
 */
export function displayHandle(
  method: PaymentMethod,
  handle: string | null | undefined,
): string | null {
  if (method === 'zelle') return (handle ?? '').trim() || null
  const name = bareUsername(handle)
  if (!name) return null
  return method === 'cashapp' ? `$${name}` : `@${name}`
}
