import Link from 'next/link'
import { requireStaff } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { listOrders } from './orders-data'
import {
  itemsSummary,
  formatMoney,
  resolveFilter,
  ORDER_FILTERS,
  PAYMENT_METHOD_LABELS,
  SHIPPING_METHOD_LABELS,
} from './order-utils'
import { OrderStatusBadge, PaymentStatusBadge } from './status-badge'
import { StatusFilter } from './status-filter'

export const metadata = { title: 'Orders · Kairo Labs Admin' }

const th: React.CSSProperties = {
  padding: '10px 12px', fontSize: 11.5, fontWeight: 600, letterSpacing: '0.06em',
  textTransform: 'uppercase', color: 'var(--ink-muted)', textAlign: 'left', whiteSpace: 'nowrap',
}
const td: React.CSSProperties = { padding: '10px 12px', verticalAlign: 'top', fontSize: 13.5 }

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  await requireStaff()
  const { status } = await searchParams
  const filter = resolveFilter(status)
  const supabase = await createClient()
  const orders = await listOrders(supabase, filter)
  const label = ORDER_FILTERS.find((f) => f.key === filter)!.label

  return (
    <section>
      <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Orders</h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: 14 }}>
            {orders.length} {orders.length === 1 ? 'order' : 'orders'}{filter !== 'all' ? ` · ${label}` : ''}. Newest first — open an order to mark it paid, ship it, or add notes.
          </p>
        </div>
        <StatusFilter active={filter} />
      </header>

      <div style={{ overflowX: 'auto', border: '1px solid var(--hair)', borderRadius: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'rgba(14,21,18,0.03)', borderBottom: '1px solid var(--hair)' }}>
            <tr>
              <th style={th}>Order</th>
              <th style={th}>Date</th>
              <th style={th}>Customer</th>
              <th style={th}>Items</th>
              <th style={{ ...th, textAlign: 'right' }}>Total</th>
              <th style={th}>Method</th>
              <th style={th}>Payment</th>
              <th style={th}>Status</th>
              <th style={th}>Shipping</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{ borderTop: '1px solid var(--hair-soft)' }}>
                <td style={{ ...td, whiteSpace: 'nowrap' }}>
                  <Link href={`/admin/orders/${o.id}`} className="font-mono" style={{ fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                    {o.order_number}
                  </Link>
                </td>
                <td style={{ ...td, whiteSpace: 'nowrap', color: 'var(--ink-muted)' }}>{formatDate(o.created_at)}</td>
                <td style={td}>
                  <Link href={`/admin/orders/${o.id}`}>{o.customer_name}</Link>
                </td>
                <td style={{ ...td, maxWidth: 320 }}>{itemsSummary(o.order_items)}</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>{formatMoney(o.total)}</td>
                <td style={td}>{PAYMENT_METHOD_LABELS[o.payment_method]}</td>
                <td style={td}><PaymentStatusBadge status={o.payment_status} /></td>
                <td style={td}><OrderStatusBadge status={o.status} /></td>
                <td style={td}>{SHIPPING_METHOD_LABELS[o.shipping_method] ?? o.shipping_method}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={9} style={{ ...td, padding: '32px 12px', textAlign: 'center', color: 'var(--ink-muted)' }}>
                  No orders{filter !== 'all' ? ` in “${label}”` : ' yet'}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
