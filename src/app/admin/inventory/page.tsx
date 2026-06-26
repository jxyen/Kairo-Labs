import { requireStaff } from '@/lib/auth/dal'
import { SectionStub } from '../section-stub'

export default async function InventoryPage() {
  await requireStaff()
  return <SectionStub title="Inventory" table="product_sizes"
    description="Track stock on hand per SKU with an auditable movement ledger." />
}
