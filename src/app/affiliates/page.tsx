import type { Metadata } from 'next'
import { ApplyForm } from './apply-form'

const TITLE = 'Affiliate Program — Partner with Kairo Labs'
const DESC =
  'Apply to the Kairo Labs affiliate program. Earn competitive commission referring qualified researchers to independently lab-tested, research-grade peptides. Research use only.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: '/affiliates' },
  openGraph: { title: TITLE, description: DESC, url: 'https://kairolabs.org/affiliates', siteName: 'Kairo Labs' },
}

const TRUST = ['≥99% purity', 'COA every lot', 'Same-day US shipping', 'Research use only']

const PERKS = [
  { label: 'Above-market commission', body: 'Paid well above the typical peptide program.' },
  { label: 'A product that verifies', body: 'Lab-tested to ≥99% purity, COA on every lot.' },
  { label: 'A partner, not a portal', body: 'Ready-made assets and a real person who answers.' },
]

export default function AffiliatesPage() {
  return (
    <main className="container" style={{ padding: '24px 20px 96px', maxWidth: 760 }}>
      {/* ---------- Hero (emerald gradient, on-dark) ---------- */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 'var(--r-2xl)',
          background: 'var(--grad-desk)',
          padding: 'clamp(30px, 6vw, 52px) clamp(22px, 5vw, 44px) clamp(26px, 5vw, 44px)',
        }}
      >
        <div
          className="font-mono"
          style={{ fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.78)' }}
        >
          Affiliate Program
        </div>
        <h1
          style={{
            margin: '14px 0 0',
            maxWidth: 540,
            fontSize: 'clamp(30px, 7.2vw, 50px)',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '-0.03em',
            lineHeight: 1.02,
            color: '#fff',
          }}
        >
          Earn more on every referral.
        </h1>
        <p style={{ margin: '16px 0 0', maxWidth: 480, fontSize: 'clamp(15px, 4vw, 17px)', lineHeight: 1.55, color: 'rgba(255,255,255,0.9)' }}>
          Send your audience to research-grade peptides they can actually verify — and earn commission well above the
          industry norm.
        </p>

        {/* Trust chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
          {TRUST.map((t) => (
            <span
              key={t}
              className="font-mono"
              style={{
                fontSize: 11.5,
                letterSpacing: '0.02em',
                padding: '6px 11px',
                borderRadius: 999,
                background: 'rgba(4,19,12,0.28)',
                border: '1px solid rgba(255,255,255,0.22)',
                color: '#fff',
                whiteSpace: 'nowrap',
              }}
            >
              {t}
            </span>
          ))}
        </div>

        <a
          href="#apply"
          className="btn btn-white"
          style={{ marginTop: 26, fontSize: 15, padding: '13px 26px' }}
        >
          Apply to join →
        </a>
      </section>

      {/* ---------- Perks (compact rows) ---------- */}
      <div style={{ display: 'flex', flexDirection: 'column', margin: '20px 0 40px' }}>
        {PERKS.map((p, i) => (
          <div
            key={p.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 13,
              padding: '13px 2px',
              borderTop: i === 0 ? 'none' : '1px solid var(--hair-soft)',
            }}
          >
            <span
              className="font-mono"
              style={{
                flex: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'var(--emerald-soft)',
                border: '1px solid var(--emerald-line)',
                color: 'var(--emerald)',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <div style={{ minWidth: 0 }}>
              <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                {p.label}
              </span>
              <span style={{ color: 'var(--ink-faint)', fontSize: 14 }}> — {p.body}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ---------- Application form ---------- */}
      <div id="apply" style={{ borderTop: '1px solid var(--hair)', paddingTop: 32, scrollMarginTop: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Apply to join</h2>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--ink-muted)' }}>
          Reviewed by hand — tell us about your reach and how you&rsquo;d promote.
        </p>
        <ApplyForm />
      </div>
    </main>
  )
}
