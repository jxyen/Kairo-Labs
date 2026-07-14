import Link from 'next/link'
import { requireStaff } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { ApplicationsTable, type ApplicationRow } from './applications-table'

export const metadata = { title: 'Affiliate Applications · Kairo Labs Admin' }

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'reviewing', label: 'Reviewing' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
] as const

export default async function AffiliateApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  await requireStaff()
  const { status } = await searchParams
  const active = FILTERS.some((f) => f.key === status) ? status! : 'all'

  const supabase = await createClient()
  let query = supabase
    .from('affiliate_applications')
    .select(
      'id, full_name, email, phone, primary_platform, primary_handle, audience_size, other_links, niche, promo_plan, experience, website, referral_source, status, admin_notes, created_at',
    )
    .order('created_at', { ascending: false })
  if (active !== 'all') {
    query = query.eq('status', active as 'new' | 'reviewing' | 'approved' | 'rejected')
  }
  const { data } = await query

  const rows = (data ?? []) as ApplicationRow[]

  return (
    <section>
      <header style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Affiliate Applications</h1>
        <p style={{ color: 'var(--ink-muted, #5b6962)', fontSize: 14 }}>
          People applying to the affiliate program. Review each, set a status, and jot notes. Approve a partner by
          creating their affiliate code in <Link href="/admin/affiliates" style={{ textDecoration: 'underline' }}>Affiliates</Link>.
        </p>
      </header>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === 'all' ? '/admin/affiliate-applications' : `/admin/affiliate-applications?status=${f.key}`}
            style={{
              fontSize: 13,
              padding: '6px 12px',
              borderRadius: 999,
              border: '1px solid rgba(14,21,18,0.12)',
              background: active === f.key ? '#0E1512' : 'transparent',
              color: active === f.key ? '#fff' : 'inherit',
              textDecoration: 'none',
            }}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <ApplicationsTable rows={rows} />
    </section>
  )
}
