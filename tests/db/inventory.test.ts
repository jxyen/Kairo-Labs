import { describe, it, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

describe('inventory schema', () => {
  it('tracks stock per size', async () => {
    const { data: p } = await admin.from('products')
      .insert({ code: 'INV-1', name: 'Inv', sub: 's', category: 'Recovery & Repair' }).select().single()
    const { data: size } = await admin.from('product_sizes')
      .insert({ product_id: p!.id, mg: '5 mg', price: 1, sku: 'INV-1-5MG' }).select().single()
    const { error } = await admin.from('inventory')
      .insert({ size_id: size!.id, quantity_on_hand: 10, reorder_threshold: 3 })
    expect(error).toBeNull()
    await admin.from('products').delete().eq('code', 'INV-1')
  })
})
