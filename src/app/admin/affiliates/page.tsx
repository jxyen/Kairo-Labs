import { requireStaff } from '@/lib/auth/dal'
import { SectionStub } from '../section-stub'

export default async function AffiliatesPage() {
  await requireStaff()
  return <SectionStub title="Affiliates" table="affiliates"
    description="Manage referral partners, codes, commission rates, and payouts." />
}
