import { requireStaff } from '@/lib/auth/dal'
import { SectionStub } from '../section-stub'

export default async function ProductsPage() {
  await requireStaff()
  return <SectionStub title="Products" table="products"
    description="Add, edit, and remove catalog products and their sizes/prices." />
}
