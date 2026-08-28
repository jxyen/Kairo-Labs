import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireStaff } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { CopyButton } from '@/components/copy-button'
import { getOrder } from '../orders-data'
import { formatAddress, formatMoney, PAYMENT_METHOD_LABELS, SHIPPING_METHOD_LABELS } from '../order-utils'
import { OrderStatusBadge, PaymentStatusBadge } from '../status-badge'
import { MarkPaidForm } from './mark-paid-form'
import { StatusActions } from './status-actions'
import { NotesForm } from './notes-form'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('orders').select('order_number').eq('id', id).maybeSingle()
  return { title: `${data?.order_number ?? 'Order'} · Kairo Labs Admin` }
}

const card: React.CSSProperties = { border: '1px solid var(--hair)', borderRadius: 10, padding: 16, background: '#fff' }
const cardTitle: React.CSSProperties = {
  fontSize: 11.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
  color: 'var(--ink-muted)', marginBottom: 10,
}
const th: React.CSSProperties = { ...cardTitle, marginBottom: 0, padding: '6px 8px', textAlign: 'left' }
const td: React.CSSProperties = { padding: '8px', fontSize: 13.5, verticalAlign: 'top', borderTop: '1px solid var(--hair-soft)' }
const right: React.CSSProperties = { textAlign: 'right', whiteSpace: 'nowrap' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff()
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const supabase = await createClient()
  const order = await getOrder(supabase, id)
  if (!order) notFound()

  const addressLines = formatAddress(order.shipping_address)
  const copyBlock = [order.customer_name, ...addressLines].join('\n')
  const live = order.status !== 'cancelled' && order.status !== 'refunded'
  const showMarkPaid = order.payment_status === 'unpaid' && live

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 1040 }}>
      <div>
        <Link href="/admin/orders" style={{ fontSize: 13, color: 'var(--ink-muted)' }}>← All orders</Link>
      </div>

      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="font-mono" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{order.order_number}</h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: 13.5, margin: 0 }}>
            Placed {formatDate(order.created_at)} · {PAYMENT_METHOD_LABELS[order.payment_method]} · {SHIPPING_METHOD_LABELS[order.shipping_method] ?? order.shipping_method} shipping
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <PaymentStatusBadge status={order.payment_status} />
          <OrderStatusBadge status={order.status} />
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        <div style={card}>
          <div style={cardTitle}>Customer</div>
          <div style={{ fontWeight: 600 }}>{order.customer_name}</div>
          {order.customer_email ? (
            <div style={{ fontSize: 13.5 }}><a href={`mailto:${order.customer_email}`} style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>{order.customer_email}</a></div>
          ) : (
            <div style={{ fontSize: 13.5, color: 'var(--ink-muted)' }}>No email</div>
          )}
          {order.customer_phone && <div style={{ fontSize: 13.5 }}>{order.customer_phone}</div>}
        </div>

        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ ...cardTitle, marginBottom: 0 }}>Ship to</div>
            {addressLines.length > 0 && <CopyButton value={copyBlock} label="Copy address" />}
          </div>
          {addressLines.length > 0 ? (
            <address style={{ fontStyle: 'normal', fontSize: 13.5, lineHeight: 1.5 }}>
              <div style={{ fontWeight: 600 }}>{order.customer_name}</div>
              {addressLines.map((line, i) => <div key={i}>{line}</div>)}
            </address>
          ) : (
            <div style={{ fontSize: 13.5, color: 'var(--ink-muted)' }}>No shipping address on file.</div>
          )}
          {order.shipments.length > 0 && (
            <div style={{ marginTop: 10, fontSize: 13 }}>
              {order.shipments.map((s) => (
                <div key={s.id}>
                  <span style={{ color: 'var(--ink-muted)' }}>Tracking:</span>{' '}
                  <span className="font-mono">{s.tracking_number ?? '—'}</span>
                  {s.carrier && <span style={{ color: 'var(--ink-muted)' }}> · {s.carrier}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={card}>
        <div style={cardTitle}>Items</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Product</th>
              <th style={th}>Size</th>
              <th style={{ ...th, ...right }}>Qty</th>
              <th style={{ ...th, ...right }}>Unit</th>
              <th style={{ ...th, ...right }}>Line</th>
            </tr>
          </thead>
          <tbody>
            {order.order_items.map((i) => (
              <tr key={i.id}>
                <td style={{ ...td, fontWeight: 600 }}>{i.product_name}</td>
                <td style={td}>{i.mg ?? '—'}</td>
                <td style={{ ...td, ...right }}>{i.quantity}</td>
                <td style={{ ...td, ...right }}>{formatMoney(i.unit_price)}</td>
                <td style={{ ...td, ...right }}>{formatMoney(i.line_total)}</td>
              </tr>
            ))}
            {order.order_items.length === 0 && (
              <tr><td colSpan={5} style={{ ...td, color: 'var(--ink-muted)' }}>No line items.</td></tr>
            )}
          </tbody>
        </table>
        <dl style={{ marginTop: 12, marginLeft: 'auto', width: 260, display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 4, fontSize: 13.5 }}>
          <dt style={{ color: 'var(--ink-muted)' }}>Subtotal</dt><dd style={right}>{formatMoney(order.subtotal)}</dd>
          {Number(order.discount_total) > 0 && (
            <><dt style={{ color: 'var(--ink-muted)' }}>Discount</dt><dd style={right}>−{formatMoney(order.discount_total)}</dd></>
          )}
          <dt style={{ color: 'var(--ink-muted)' }}>Shipping</dt><dd style={right}>{Number(order.shipping_cost) > 0 ? formatMoney(order.shipping_cost) : 'Free'}</dd>
          <dt style={{ fontWeight: 700, borderTop: '1px solid var(--hair)', paddingTop: 6 }}>Total</dt>
          <dd style={{ ...right, fontWeight: 700, borderTop: '1px solid var(--hair)', paddingTop: 6 }}>{formatMoney(order.total)}</dd>
        </dl>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
        <div style={card}>
          <div style={cardTitle}>Payments</div>
          {order.payments.length === 0 ? (
            <p style={{ fontSize: 13.5, color: 'var(--ink-muted)', margin: 0 }}>No payments recorded.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr><th style={th}>Method</th><th style={{ ...th, ...right }}>Amount</th><th style={th}>Status</th><th style={th}>Reference</th><th style={th}>When</th></tr>
              </thead>
              <tbody>
                {order.payments.map((p) => (
                  <tr key={p.id}>
                    <td style={td}>{PAYMENT_METHOD_LABELS[p.method]}</td>
                    <td style={{ ...td, ...right }}>{formatMoney(p.amount)}</td>
                    <td style={td}>{p.status}</td>
                    <td style={{ ...td, wordBreak: 'break-word' }} className="font-mono">{p.reference ?? '—'}</td>
                    <td style={{ ...td, whiteSpace: 'nowrap', color: 'var(--ink-muted)' }}>{formatDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {showMarkPaid && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--hair)' }}>
              <MarkPaidForm orderId={order.id} defaultMethod={order.payment_method} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={card}>
            <StatusActions orderId={order.id} status={order.status} />
          </div>
          <div style={card}>
            <NotesForm orderId={order.id} initial={order.notes} />
          </div>
        </div>
      </div>
    </section>
  )
}
