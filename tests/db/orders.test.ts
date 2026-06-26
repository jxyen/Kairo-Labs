import { describe, it, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

describe('orders schema', () => {
  it('creates an order with an item and a payment', async () => {
    const { data: order, error } = await admin.from('orders').insert({
      order_number: 'KL-TEST-1', customer_name: 'Jane',
      status: 'pending', payment_method: 'venmo', payment_status: 'unpaid',
      subtotal: 23.99, total: 23.99,
    }).select().single()
    expect(error).toBeNull()
    const { error: iErr } = await admin.from('order_items').insert({
      order_id: order!.id, product_name: 'BPC-157', mg: '5 mg',
      unit_price: 23.99, quantity: 1, line_total: 23.99,
    })
    expect(iErr).toBeNull()
    const { error: pErr } = await admin.from('payments').insert({
      order_id: order!.id, method: 'venmo', amount: 23.99, status: 'pending',
    })
    expect(pErr).toBeNull()
    await admin.from('orders').delete().eq('order_number', 'KL-TEST-1')
  })
})
