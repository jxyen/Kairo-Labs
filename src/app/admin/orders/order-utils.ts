// Pure helpers for the admin orders UI: formatting, status workflow, and list
// filters. No server-only imports — unit-tested directly in tests/lib.
import type { Database } from '@/lib/supabase/database.types'

export type OrderStatus = Database['public']['Enums']['order_status']
export type PaymentStatus = Database['public']['Enums']['payment_status']
export type PaymentMethod = Database['public']['Enums']['payment_method']

/** "3× GHK-Cu 50 mg, 1× BPC-157 5 mg" — the one-line items column on the list. */
export function itemsSummary(
  items: ReadonlyArray<{ product_name: string; mg: string | null; quantity: number }>,
): string {
  if (items.length === 0) return '—'
  return items
    .map((i) => `${i.quantity}× ${i.product_name}${i.mg ? ` ${i.mg}` : ''}`)
    .join(', ')
}

/**
 * Staff-driven status workflow. `paid` is only ever entered via the
 * mark_order_paid RPC (never a status edit), so it has no inbound edge here.
 * Cancelling is allowed from every live status; cancelled/refunded are terminal.
 */
export const STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ['cancelled'],
  paid: ['fulfilled', 'shipped', 'cancelled'],
  fulfilled: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: ['cancelled'],
  cancelled: [],
  refunded: [],
}

export function nextStatuses(from: OrderStatus): readonly OrderStatus[] {
  return STATUS_TRANSITIONS[from] ?? []
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return nextStatuses(from).includes(to)
}

/** List-page buckets. Every order status belongs to exactly one non-"all" bucket. */
export const ORDER_FILTERS = [
  { key: 'all', label: 'All', statuses: null },
  { key: 'needs_payment', label: 'Needs payment', statuses: ['pending'] },
  { key: 'to_ship', label: 'Paid – to ship', statuses: ['paid', 'fulfilled'] },
  { key: 'shipped', label: 'Shipped', statuses: ['shipped', 'delivered'] },
  { key: 'cancelled', label: 'Cancelled', statuses: ['cancelled', 'refunded'] },
] as const satisfies ReadonlyArray<{ key: string; label: string; statuses: readonly OrderStatus[] | null }>

export type OrderFilterKey = (typeof ORDER_FILTERS)[number]['key']

export function resolveFilter(key: string | undefined): OrderFilterKey {
  return ORDER_FILTERS.some((f) => f.key === key) ? (key as OrderFilterKey) : 'all'
}

export function statusesForFilter(key: OrderFilterKey): OrderStatus[] | null {
  const f = ORDER_FILTERS.find((x) => x.key === key)
  return f?.statuses ? [...f.statuses] : null
}

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

/** Postgres numerics arrive as number or string depending on the path — accept both. */
export function formatMoney(value: number | string | null | undefined): string {
  return usd.format(Number(value ?? 0))
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  venmo: 'Venmo',
  cashapp: 'Cash App',
  zelle: 'Zelle',
  card: 'Card',
  applepay: 'Apple Pay',
  googlepay: 'Google Pay',
  crypto: 'Crypto',
  other: 'Other',
}

/** Methods staff can pick when marking an order paid by hand. */
export const MANUAL_PAYMENT_METHODS: readonly PaymentMethod[] = ['venmo', 'cashapp', 'zelle', 'crypto', 'other']

export const SHIPPING_METHOD_LABELS: Record<string, string> = {
  standard: 'Standard',
  priority: 'Priority',
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  fulfilled: 'Fulfilled',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

/** orders.shipping_address jsonb → postal lines. Tolerates null/malformed values. */
export function formatAddress(value: unknown): string[] {
  if (!value || typeof value !== 'object') return []
  const a = value as Record<string, unknown>
  const str = (k: string) => (typeof a[k] === 'string' ? (a[k] as string).trim() : '')
  const cityLine = [str('city'), [str('state'), str('postal_code')].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ')
  return [str('line1'), str('line2'), cityLine, str('country')].filter(Boolean)
}
