import { requireStaff } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { ReviewTable, type ReviewRow } from './review-table'

export const metadata = { title: 'Payments Review · Kairo Labs Admin' }

export default async function PaymentsReviewPage() {
  await requireStaff()
  const supabase = await createClient()
  const { data } = await supabase
    .from('payment_events')
    .select('id, method, amount, sender, note, raw_text, received_at, status, candidate_orders')
    .in('status', ['unmatched', 'ambiguous'])
    .order('received_at', { ascending: false })

  const rows: ReviewRow[] = (data ?? []).map((r) => ({ ...r, amount: Number(r.amount) }))

  return (
    <section>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Payments Review</h1>
      <p style={{ color: 'var(--ink-muted)', marginBottom: 20 }}>
        Payments the auto-matcher couldn’t confirm on its own. Apply each to the right order, or dismiss it.
      </p>
      <ReviewTable rows={rows} />
    </section>
  )
}
