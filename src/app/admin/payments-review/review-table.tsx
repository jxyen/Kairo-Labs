'use client'
import { useState, useTransition } from 'react'
import { applyEvent, dismissEvent } from './actions'

export interface ReviewRow {
  id: string
  method: string
  amount: number
  sender: string | null
  note: string | null
  raw_text: string
  received_at: string
  status: string
  candidate_orders: string[] | null
}

export function ReviewTable({ rows }: { rows: ReviewRow[] }) {
  if (rows.length === 0) {
    return <p style={{ color: 'var(--ink-muted)' }}>No events awaiting review.</p>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {rows.map((r) => <Card key={r.id} row={r} />)}
    </div>
  )
}

function Card({ row }: { row: ReviewRow }) {
  const [orderNumber, setOrderNumber] = useState(row.candidate_orders?.[0] ?? '')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function onApply() {
    setError(null)
    start(async () => {
      const res = await applyEvent(row.id, orderNumber.trim().toUpperCase())
      if (!res.ok) setError(res.error)
    })
  }
  function onDismiss() {
    setError(null)
    start(async () => {
      const res = await dismissEvent(row.id)
      if (!res.ok) setError(res.error)
    })
  }

  return (
    <div style={{ border: '1px solid var(--hair)', borderRadius: 10, padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <strong>${row.amount.toFixed(2)}</strong> · {row.method} · {row.status}
          <div style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>
            {row.sender ?? 'unknown sender'} · {new Date(row.received_at).toLocaleString()}
          </div>
          {row.note && <div style={{ fontSize: 12.5, marginTop: 4 }}>note: {row.note}</div>}
          {row.candidate_orders?.length ? (
            <div style={{ fontSize: 12.5, marginTop: 4 }}>candidates: {row.candidate_orders.join(', ')}</div>
          ) : null}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="KL-YYYYMMDD-XXXX"
          className="font-mono"
          style={{ padding: '6px 8px', border: '1px solid var(--hair)', borderRadius: 6, fontSize: 13 }}
        />
        <button onClick={onApply} disabled={pending || !orderNumber.trim()} className="btn btn-primary">
          Apply to order
        </button>
        <button onClick={onDismiss} disabled={pending} className="btn">Dismiss</button>
        {error && <span style={{ color: 'crimson', fontSize: 12.5 }}>{error}</span>}
      </div>
    </div>
  )
}
