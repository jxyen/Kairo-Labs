import { requireOwner } from '@/lib/auth/dal'
import { SectionStub } from './section-stub'

export default async function DashboardPage() {
  await requireOwner()
  return (
    <SectionStub
      title="Dashboard"
      table="orders"
      description="Revenue and key metrics, aggregated from orders. Owner-only."
    />
  )
}
