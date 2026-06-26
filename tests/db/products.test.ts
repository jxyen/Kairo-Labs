import { describe, it, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!
const admin = createClient(url, service, { auth: { persistSession: false } })

describe('products schema', () => {
  it('can insert a product with a size', async () => {
    const { data: product, error: pErr } = await admin
      .from('products')
      .insert({ code: 'TEST-1', name: 'Test', sub: 's', category: 'Recovery & Repair' })
      .select().single()
    expect(pErr).toBeNull()
    const { error: sErr } = await admin
      .from('product_sizes')
      .insert({ product_id: product!.id, mg: '5 mg', price: 9.99, sku: 'TEST-1-5MG' })
    expect(sErr).toBeNull()
    await admin.from('products').delete().eq('code', 'TEST-1')
  })
})
