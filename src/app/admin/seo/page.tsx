import { requireStaff } from '@/lib/auth/dal'
import { loadSeoSnapshot } from './actions'
import { SeoDashboard } from './seo-dashboard'

export const dynamic = 'force-dynamic'
export const metadata = { robots: { index: false, follow: false } }

export default async function AdminSeoPage() {
  await requireStaff()
  const initial = await loadSeoSnapshot(28)
  return <SeoDashboard initial={initial} />
}
