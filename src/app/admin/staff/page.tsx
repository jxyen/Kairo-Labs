import { requireOwner } from '@/lib/auth/dal'
import { SectionStub } from '../section-stub'

export default async function StaffPage() {
  await requireOwner()
  return <SectionStub title="Staff" table="staff"
    description="Invite team members and set roles (owner / staff). Owner-only." />
}
