import { describe, it, expect, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { getOrderForPayment } from '../../src/lib/orders/queries'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

describe('getOrderForPayment', () => {
  afterAll(async () => { await admin.from('orders').delete().eq('order_number', 'KL-QRY-01') })
  it('maps a known order and returns null for unknown', async () => {
    await admin.from('orders').insert({
      order_number: 'KL-QRY-01', customer_name: 'Q', status: 'pending',
      payment_method: 'venmo', payment_status: 'unpaid', subtotal: 20, total: 29.99,
    })
    const o = await getOrderForPayment('KL-QRY-01')
    expect(o?.orderNumber).toBe('KL-QRY-01')
    expect(o?.paymentMethod).toBe('venmo')
    expect(o?.total).toBeCloseTo(29.99, 2)
    expect(await getOrderForPayment('KL-MISSING')).toBeNull()
  })
})
