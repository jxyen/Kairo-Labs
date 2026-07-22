'use client'

import { useState, useTransition } from 'react'
import { loadSeoSnapshot, type SeoSnapshot } from './actions'
import type { GscRow } from '@/lib/seo/gsc'

const RANGES = [
  { label: '7 days', days: 7 },
  { label: '28 days', days: 28 },
  { label: '3 months', days: 90 },
]

const nf = new Intl.NumberFormat('en-US')
const pct = (n: number) => `${(n * 100).toFixed(1)}%`
const pos = (n: number) => (n ? n.toFixed(1) : '—')

export function SeoDashboard({ initial }: { initial: SeoSnapshot }) {
  const [snap, setSnap] = useState(initial)
  const [days, setDays] = useState(initial.range.days)
  const [pending, startTransition] = useTransition()

  function pick(d: number) {
    setDays(d)
    startTransition(async () => setSnap(await loadSeoSnapshot(d)))
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Search Console</h1>
          <p className="text-sm text-black/50">
            Organic search performance for kairolabs.org · {snap.range.startDate} → {snap.range.endDate}
          </p>
        </div>
        <div className="flex overflow-hidden rounded-lg border border-black/15 text-sm">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => pick(r.days)}
              disabled={pending}
              className={`px-3 py-1.5 ${
                days === r.days ? 'bg-black text-white' : 'bg-white hover:bg-black/5'
              } disabled:opacity-50`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {!snap.configured ? (
        <NotConfigured />
      ) : snap.error ? (
        <Callout tone="error" title="Search Console API error">
          {snap.error}
        </Callout>
      ) : (
        <div className={pending ? 'opacity-50 transition-opacity' : 'transition-opacity'}>
          <Totals snap={snap} />
          <TrendChart data={snap.byDate} />
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <RowTable title="Top queries" dim="Query" rows={snap.topQueries} />
            <RowTable title="Top pages" dim="Page" rows={snap.topPages} strip />
          </div>
          {snap.totals.impressions === 0 && <ZeroState />}
        </div>
      )}
    </div>
  )
}

function Totals({ snap }: { snap: SeoSnapshot }) {
  const t = snap.totals
  const cards = [
    { label: 'Total clicks', value: nf.format(t.clicks) },
    { label: 'Total impressions', value: nf.format(t.impressions) },
    { label: 'Average CTR', value: pct(t.ctr) },
    { label: 'Average position', value: pos(t.position) },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-black/10 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-black/45">{c.label}</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{c.value}</div>
        </div>
      ))}
    </div>
  )
}

function TrendChart({ data }: { data: SeoSnapshot['byDate'] }) {
  if (data.length < 2) return null
  const w = 960
  const h = 180
  const pad = 8
  const maxImp = Math.max(...data.map((d) => d.impressions), 1)
  const maxClk = Math.max(...data.map((d) => d.clicks), 1)
  const x = (i: number) => pad + (i * (w - pad * 2)) / (data.length - 1)
  const yImp = (v: number) => h - pad - (v / maxImp) * (h - pad * 2)
  const yClk = (v: number) => h - pad - (v / maxClk) * (h - pad * 2)
  const path = (accessor: (d: SeoSnapshot['byDate'][0]) => number, y: (v: number) => number) =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(accessor(d)).toFixed(1)}`).join(' ')

  return (
    <div className="mt-4 rounded-xl border border-black/10 bg-white p-4">
      <div className="mb-2 flex items-center gap-4 text-xs text-black/55">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: '#18B883' }} />
          Impressions
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-black" /> Clicks
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height: 180 }}>
        <path d={path((d) => d.impressions, yImp)} fill="none" stroke="#18B883" strokeWidth={2} />
        <path d={path((d) => d.clicks, yClk)} fill="none" stroke="#000" strokeWidth={2} />
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-black/40">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  )
}

function RowTable({ title, dim, rows, strip }: { title: string; dim: string; rows: GscRow[]; strip?: boolean }) {
  const clean = (k: string) => (strip ? k.replace(/^https?:\/\/[^/]+/, '') || '/' : k)
  return (
    <div className="rounded-xl border border-black/10 bg-white">
      <div className="border-b border-black/10 px-4 py-3 text-sm font-semibold">{title}</div>
      {rows.length === 0 ? (
        <div className="px-4 py-6 text-sm text-black/45">No data in this window yet.</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-black/40">
              <th className="px-4 py-2 font-medium">{dim}</th>
              <th className="px-2 py-2 text-right font-medium">Clk</th>
              <th className="px-2 py-2 text-right font-medium">Imp</th>
              <th className="px-4 py-2 text-right font-medium">Pos</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 25).map((r) => (
              <tr key={r.keys.join('|')} className="border-t border-black/5">
                <td className="max-w-0 truncate px-4 py-2" title={clean(r.keys[0])}>
                  {clean(r.keys[0])}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">{nf.format(r.clicks)}</td>
                <td className="px-2 py-2 text-right tabular-nums">{nf.format(r.impressions)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-black/60">{pos(r.position)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function ZeroState() {
  return (
    <Callout tone="info" title="No impressions yet — that's expected for a ~2-month-old domain">
      Google has your sitemap but hasn&apos;t started ranking pages. This dashboard will populate as
      pages get indexed. Fastest levers: request-index key URLs in Search Console, earn a few external
      links, and make pages CDN-cacheable (they&apos;re currently <code>force-dynamic</code>).
    </Callout>
  )
}

function NotConfigured() {
  return (
    <Callout tone="warn" title="Connect Google Search Console">
      <p>Set three server env vars in Vercel (Production), then redeploy:</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>
          <code>GSC_SA_EMAIL</code> — service-account email
        </li>
        <li>
          <code>GSC_SA_PRIVATE_KEY</code> — its private key (paste the whole <code>BEGIN…END</code> block)
        </li>
        <li>
          <code>GSC_SITE_URL</code> — <code>sc-domain:kairolabs.org</code>
        </li>
      </ul>
      <p className="mt-2">
        Then add <code>GSC_SA_EMAIL</code> as a user on the kairolabs.org property in Search Console →
        Settings → Users and permissions.
      </p>
    </Callout>
  )
}

function Callout({
  tone,
  title,
  children,
}: {
  tone: 'info' | 'warn' | 'error'
  title: string
  children: React.ReactNode
}) {
  const styles = {
    info: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    warn: 'border-amber-200 bg-amber-50 text-amber-900',
    error: 'border-red-200 bg-red-50 text-red-900',
  }[tone]
  return (
    <div className={`rounded-xl border p-5 text-sm ${styles}`}>
      <div className="mb-1 font-semibold">{title}</div>
      <div className="[&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[12px]">
        {children}
      </div>
    </div>
  )
}
