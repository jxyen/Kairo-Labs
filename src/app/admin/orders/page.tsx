import { requireStaff } from '@/lib/auth/dal'
import { SectionStub } from '../section-stub'

export default async function OrdersPage() {
  await requireStaff()
  return <SectionStub title="Orders" table="orders"
    description="Create, track, and update customer orders and their payment status." />
}
