import { requireStaff } from '@/lib/auth/dal'
import { SectionStub } from '../section-stub'

export default async function ShippingPage() {
  await requireStaff()
  return <SectionStub title="Shipping" table="shipments"
    description="Create shipping labels and track carrier, tracking number, and cost." />
}
