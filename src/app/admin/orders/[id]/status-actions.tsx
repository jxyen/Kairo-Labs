'use client'
import { useState, useTransition } from 'react'
import { setStatusAction } from '../actions'
import { nextStatuses, ORDER_STATUS_LABELS, type OrderStatus } from '../order-utils'

const VERBS: Partial<Record<OrderStatus, string>> = {
  fulfilled: 'Mark fulfilled',
  shipped: 'Mark shipped',
  delivered: 'Mark delivered',
  cancelled: 'Cancel order',
}

export function StatusActions({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [tracking, setTracking] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const options = nextStatuses(status)
  const canShip = options.includes('shipped')

  function move(to: OrderStatus) {
    if (to === 'cancelled' && !window.confirm(`Cancel this order? It is currently ${ORDER_STATUS_LABELS[status].toLowerCase()}.`)) return
    setError(null)
    start(async () => {
      const res = await setStatusAction({
        orderId, to, trackingNumber: to === 'shipped' && tracking.trim() ? tracking.trim() : undefined,
      })
      if (!res.ok) setError(res.error)
      else if (to === 'shipped') setTracking('')
    })
  }

  if (options.length === 0) {
    return <p style={{ fontSize: 12.5, color: 'var(--ink-muted)', margin: 0 }}>This order is {ORDER_STATUS_LABELS[status].toLowerCase()} — no further status changes.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontWeight: 600 }}>Status</div>
      {canShip && (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
          <span style={{ color: 'var(--ink-muted)' }}>Tracking number (optional, saved when you mark shipped)</span>
          <input
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="e.g. 9400 1000 0000 0000 0000 00"
            style={{ padding: '6px 8px', border: '1px solid var(--hair)', borderRadius: 6, fontSize: 13, background: '#fff' }}
          />
        </label>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {options.filter((s) => s !== 'cancelled').map((s) => (
          <button key={s} type="button" disabled={pending} onClick={() => move(s)} className="btn btn-dark" style={{ padding: '8px 14px', fontSize: 13 }}>
            {VERBS[s] ?? ORDER_STATUS_LABELS[s]}
          </button>
        ))}
        {options.includes('cancelled') && (
          <button type="button" disabled={pending} onClick={() => move('cancelled')} className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 13, color: 'crimson' }}>
            {VERBS.cancelled}
          </button>
        )}
        {error && <span role="alert" style={{ color: 'crimson', fontSize: 12.5 }}>{error}</span>}
      </div>
    </div>
  )
}
