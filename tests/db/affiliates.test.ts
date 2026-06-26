import { describe, it, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

describe('affiliates + shipments', () => {
  it('links an order to an affiliate and a shipment', async () => {
    const { data: aff } = await admin.from('affiliates')
      .insert({ name: 'Ref', email: 'r@x.com', code: 'REF10', commission_rate: 10 })
      .select().single()
    const { data: order } = await admin.from('orders').insert({
      order_number: 'KL-AFF-1', customer_name: 'Jane', subtotal: 10, total: 10,
      affiliate_id: aff!.id,
    }).select().single()
    const { error } = await admin.from('shipments')
      .insert({ order_id: order!.id, carrier: 'USPS', tracking_number: '1Z', cost: 5 })
    expect(error).toBeNull()
    await admin.from('orders').delete().eq('order_number', 'KL-AFF-1')
    await admin.from('affiliates').delete().eq('code', 'REF10')
  })
})
