'use client'
import { useState, useTransition } from 'react'
import { setApplicationStatus, setApplicationNotes } from './actions'

export interface ApplicationRow {
  id: string
  full_name: string
  email: string
  phone: string | null
  primary_platform: string
  primary_handle: string
  audience_size: string
  other_links: string | null
  niche: string
  promo_plan: string
  experience: string | null
  website: string | null
  referral_source: string | null
  status: 'new' | 'reviewing' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
}

const STATUS_META: Record<ApplicationRow['status'], { label: string; bg: string; fg: string }> = {
  new: { label: 'New', bg: '#dbeafe', fg: '#1e40af' },
  reviewing: { label: 'Reviewing', bg: '#fef3c7', fg: '#92400e' },
  approved: { label: 'Approved', bg: '#d1fae5', fg: '#065f46' },
  rejected: { label: 'Rejected', bg: '#fee2e2', fg: '#991b1b' },
}

const NEXT_STATUSES: ApplicationRow['status'][] = ['new', 'reviewing', 'approved', 'rejected']

export function ApplicationsTable({ rows }: { rows: ApplicationRow[] }) {
  if (rows.length === 0) {
    return <p style={{ color: 'var(--ink-muted, #5b6962)' }}>No applications yet.</p>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {rows.map((r) => (
        <Card key={r.id} row={r} />
      ))}
    </div>
  )
}

function Card({ row }: { row: ApplicationRow }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const meta = STATUS_META[row.status]

  function changeStatus(status: ApplicationRow['status']) {
    if (status === row.status) return
    setError(null)
    start(async () => {
      const res = await setApplicationStatus(row.id, status)
      if (!res.ok) setError(res.error)
    })
  }

  return (
    <div style={{ border: '1px solid rgba(14,21,18,0.12)', borderRadius: 10, background: '#fff', overflow: 'hidden' }}>
      {/* Header row */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          all: 'unset',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '14px 16px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14.5 }}>{row.full_name}</div>
          <div style={{ fontSize: 12.5, color: '#5b6962', marginTop: 2 }}>
            {row.primary_platform} · {row.audience_size} · {row.primary_handle}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span
            style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 999, background: meta.bg, color: meta.fg }}
          >
            {meta.label}
          </span>
          <span style={{ fontSize: 12, color: '#9aa79f' }}>{new Date(row.created_at).toLocaleDateString()}</span>
          <span style={{ fontSize: 12, color: '#9aa79f' }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid rgba(14,21,18,0.08)', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <Detail label="Email" value={<a href={`mailto:${row.email}`} style={{ color: '#0E1512' }}>{row.email}</a>} />
            {row.phone && <Detail label="Phone" value={row.phone} />}
            <Detail label="Main platform" value={`${row.primary_platform} — ${row.primary_handle}`} />
            <Detail label="Audience size" value={row.audience_size} />
            {row.website && <Detail label="Website" value={<LinkOut href={row.website} />} />}
            {row.referral_source && <Detail label="Heard about us" value={row.referral_source} />}
          </div>

          {row.other_links && <Detail label="Other platforms / links" value={<Multiline text={row.other_links} />} />}
          <Detail label="Niche & audience" value={<Multiline text={row.niche} />} />
          <Detail label="Promotion plan" value={<Multiline text={row.promo_plan} />} />
          {row.experience && <Detail label="Prior experience" value={<Multiline text={row.experience} />} />}

          {/* Status controls */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 2 }}>
            <span style={{ fontSize: 12, color: '#5b6962', marginRight: 2 }}>Set status:</span>
            {NEXT_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => changeStatus(s)}
                disabled={pending || s === row.status}
                style={{
                  fontSize: 12.5,
                  padding: '5px 11px',
                  borderRadius: 7,
                  border: '1px solid rgba(14,21,18,0.15)',
                  background: s === row.status ? STATUS_META[s].bg : '#fff',
                  color: s === row.status ? STATUS_META[s].fg : '#0E1512',
                  cursor: s === row.status ? 'default' : 'pointer',
                  fontWeight: s === row.status ? 600 : 400,
                }}
              >
                {STATUS_META[s].label}
              </button>
            ))}
          </div>

          <NotesEditor id={row.id} initial={row.admin_notes ?? ''} />

          {error && <span style={{ color: 'crimson', fontSize: 12.5 }}>{error}</span>}
        </div>
      )}
    </div>
  )
}

function NotesEditor({ id, initial }: { id: string; initial: string }) {
  const [notes, setNotes] = useState(initial)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const dirty = notes !== initial

  function save() {
    setError(null)
    setSaved(false)
    start(async () => {
      const res = await setApplicationNotes(id, notes)
      if (res.ok) setSaved(true)
      else setError(res.error)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9aa79f' }}>
        Internal notes
      </span>
      <textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value)
          setSaved(false)
        }}
        rows={2}
        placeholder="Notes for the team (not shown to the applicant)…"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '8px 10px',
          border: '1px solid rgba(14,21,18,0.15)',
          borderRadius: 7,
          fontSize: 13,
          resize: 'vertical',
          fontFamily: 'inherit',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={save}
          disabled={pending || !dirty}
          style={{
            fontSize: 12.5,
            padding: '5px 12px',
            borderRadius: 7,
            border: '1px solid rgba(14,21,18,0.15)',
            background: dirty ? '#0E1512' : '#f1f5f1',
            color: dirty ? '#fff' : '#9aa79f',
            cursor: dirty ? 'pointer' : 'default',
          }}
        >
          {pending ? 'Saving…' : 'Save notes'}
        </button>
        {saved && !dirty && <span style={{ fontSize: 12, color: '#065f46' }}>Saved</span>}
        {error && <span style={{ fontSize: 12, color: 'crimson' }}>{error}</span>}
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9aa79f', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 13.5, color: '#0E1512' }}>{value}</div>
    </div>
  )
}

function Multiline({ text }: { text: string }) {
  return <div style={{ fontSize: 13.5, lineHeight: 1.55, color: '#36433D', whiteSpace: 'pre-wrap' }}>{text}</div>
}

function LinkOut({ href }: { href: string }) {
  const url = href.startsWith('http') ? href : `https://${href}`
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#18B883' }}>
      {href}
    </a>
  )
}
