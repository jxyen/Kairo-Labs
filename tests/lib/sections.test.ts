import { describe, it, expect } from 'vitest'
import { ADMIN_SECTIONS } from '../../src/lib/admin/sections'

describe('admin sections', () => {
  it('defines all nine feature sections', () => {
    const slugs = ADMIN_SECTIONS.map((s) => s.slug)
    expect(slugs).toEqual([
      'dashboard', 'orders', 'products', 'inventory', 'affiliates', 'shipping', 'staff', 'payment-accounts', 'payments-review',
    ])
  })
  it('marks payments-review as visible to all staff', () => {
    expect(ADMIN_SECTIONS.find((s) => s.slug === 'payments-review')?.ownerOnly).toBe(false)
  })
  it('marks dashboard as owner-only', () => {
    expect(ADMIN_SECTIONS.find((s) => s.slug === 'dashboard')?.ownerOnly).toBe(true)
  })
})
