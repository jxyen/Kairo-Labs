'use client'
import { useState, useTransition } from 'react'
import { markPaidAction } from '../actions'
import { MANUAL_PAYMENT_METHODS, PAYMENT_METHOD_LABELS, type PaymentMethod } from '../order-utils'

const input: React.CSSProperties = { padding: '6px 8px', border: '1px solid var(--hair)', borderRadius: 6, fontSize: 13, background: '#fff' }

export function MarkPaidForm({ orderId, defaultMethod }: { orderId: string; defaultMethod: PaymentMethod }) {
  const methods = MANUAL_PAYMENT_METHODS.includes(defaultMethod)
    ? MANUAL_PAYMENT_METHODS
    : [defaultMethod, ...MANUAL_PAYMENT_METHODS]
  const [method, setMethod] = useState<PaymentMethod>(defaultMethod)
  const [reference, setReference] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      const res = await markPaidAction({ orderId, method, reference: reference.trim() || undefined })
      if (!res.ok) setError(res.error)
    })
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontWeight: 600 }}>Mark paid</div>
      <p style={{ fontSize: 12.5, color: 'var(--ink-muted)', margin: 0 }}>
        Pick the app the money actually arrived on — customers don’t always use the one they chose at checkout.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
          <span style={{ color: 'var(--ink-muted)' }}>Paid via</span>
          <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} style={input} aria-label="Payment method">
            {methods.map((m) => <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, flex: 1, minWidth: 160 }}>
          <span style={{ color: 'var(--ink-muted)' }}>Reference (optional)</span>
          <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Sender handle, transaction id…" style={input} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button type="submit" disabled={pending} className="btn btn-dark" style={{ padding: '8px 14px', fontSize: 13 }}>
          {pending ? 'Marking…' : 'Mark as paid'}
        </button>
        {error && <span role="alert" style={{ color: 'crimson', fontSize: 12.5 }}>{error}</span>}
      </div>
    </form>
  )
}
