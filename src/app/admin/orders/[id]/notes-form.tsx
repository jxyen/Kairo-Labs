'use client'
import { useState, useTransition } from 'react'
import { saveNotesAction } from '../actions'

export function NotesForm({ orderId, initial }: { orderId: string; initial: string | null }) {
  const [notes, setNotes] = useState(initial ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const dirty = notes !== (initial ?? '')

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    start(async () => {
      const res = await saveNotesAction({ orderId, notes })
      if (!res.ok) setError(res.error)
      else setSaved(true)
    })
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontWeight: 600 }} htmlFor="order-notes">Internal notes</label>
      <textarea
        id="order-notes"
        value={notes}
        onChange={(e) => { setNotes(e.target.value); setSaved(false) }}
        rows={4}
        placeholder="Only staff see this. Tracking quirks, customer requests, anything the next person should know."
        style={{ padding: '8px 10px', border: '1px solid var(--hair)', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', background: '#fff' }}
      />
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button type="submit" disabled={pending || !dirty} className="btn btn-ghost" style={{ padding: '7px 14px', fontSize: 13 }}>
          {pending ? 'Saving…' : 'Save notes'}
        </button>
        {saved && !dirty && <span style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>Saved.</span>}
        {error && <span role="alert" style={{ color: 'crimson', fontSize: 12.5 }}>{error}</span>}
      </div>
    </form>
  )
}
