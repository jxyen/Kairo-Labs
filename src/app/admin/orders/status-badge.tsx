import type { OrderStatus, PaymentStatus } from './order-utils'
import { ORDER_STATUS_LABELS } from './order-utils'

const base: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 9px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.01em',
  whiteSpace: 'nowrap',
}

const ORDER_TONES: Record<OrderStatus, React.CSSProperties> = {
  pending: { background: '#FEF3C7', color: '#92400E' },
  paid: { background: '#DBEAFE', color: '#1E40AF' },
  fulfilled: { background: '#E0E7FF', color: '#3730A3' },
  shipped: { background: '#CCFBF1', color: '#115E59' },
  delivered: { background: '#D1FAE5', color: '#065F46' },
  cancelled: { background: 'rgba(14,21,18,0.08)', color: 'var(--ink-muted)' },
  refunded: { background: '#FEE2E2', color: '#991B1B' },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span style={{ ...base, ...ORDER_TONES[status] }}>{ORDER_STATUS_LABELS[status]}</span>
}

const PAYMENT_TONES: Record<PaymentStatus, React.CSSProperties> = {
  unpaid: { background: '#FEE2E2', color: '#991B1B' },
  paid: { background: '#D1FAE5', color: '#065F46' },
  refunded: { background: 'rgba(14,21,18,0.08)', color: 'var(--ink-muted)' },
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <span style={{ ...base, ...PAYMENT_TONES[status] }}>{status}</span>
}
