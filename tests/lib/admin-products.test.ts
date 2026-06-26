import { vi } from 'vitest'
vi.mock('@/lib/auth/dal', () => ({ requireStaff: async () => ({ id: 'test', role: 'owner', active: true }) }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => {
    const { createClient } = await import('@supabase/supabase-js')
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
  },
}))
vi.mock('next/cache', () => ({ revalidateTag: () => {} }))

import { describe, it, expect, afterAll } from 'vitest'
import { createProduct, setProductActive, deleteSize } from '../../src/app/admin/products/actions'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

const base = {
  code: 'ADM-TEST', name: 'Admin Test', category: 'Recovery & Repair' as const,
  sizes: [{ mg: '5 mg', price: 10, sku: 'ADM-TEST-5MG' }],
}

afterAll(async () => { await admin.from('products').delete().eq('code', 'ADM-TEST') })

describe('product actions', () => {
  let id: string
  it('creates a product with a size', async () => {
    const r = await createProduct(base)
    expect(r.ok).toBe(true)
    const { data } = await admin.from('products').select('id,product_sizes(id)').eq('code', 'ADM-TEST').single()
    id = data!.id
    expect(data!.product_sizes).toHaveLength(1)
  })
  it('rejects duplicate code', async () => {
    const r = await createProduct(base)
    expect(r.ok).toBe(false)
  })
  it('soft-deletes (deactivates)', async () => {
    const r = await setProductActive(id, false)
    expect(r.ok).toBe(true)
    const { data } = await admin.from('products').select('active').eq('id', id).single()
    expect(data!.active).toBe(false)
  })
  it('blocks deleting the last size', async () => {
    const { data } = await admin.from('product_sizes').select('id').eq('sku', 'ADM-TEST-5MG').single()
    const r = await deleteSize(data!.id)
    expect(r.ok).toBe(false)
  })
})
