import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'
import { shippingCost, type ShippingMethod } from '../../src/lib/cart/cart'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

let cheapId: string   // a size priced so 1 unit < 150
let cheapPrice: number

beforeAll(async () => {
  // Ensure catalog data exists so this file passes in isolation (matches catalog.test.ts).
  execSync('npm run db:seed', { stdio: 'inherit' })
  const { data } = await admin
    .from('product_sizes')
    .select('id, price, products!inner(active)')
    .eq('products.active', true)
    .order('price', { ascending: true })
    .limit(1)
    .single()
  cheapId = data!.id
  cheapPrice = Number(data!.price)
})

const customer = { name: 'Jane Buyer', email: 'jane@example.com', address: { line1: '1 St', city: 'X', state: 'CA', postal_code: '90001', country: 'US' } }

async function place(items: { size_id: string; quantity: number }[]) {
  return admin.rpc('place_order', { p_items: items, p_customer: customer, p_payment_method: 'cashapp' })
}

async function placeAndRead(sizeId: string, qty: number, method: ShippingMethod) {
  const { data, error } = await admin.rpc('place_order', {
    p_items: [{ size_id: sizeId, quantity: qty }],
    p_customer: customer,
    p_payment_method: 'venmo',
    p_shipping_method: method,
  })
  expect(error).toBeNull()
  const orderNumber = (data as { order_number: string }).order_number
  const { data: row } = await admin.from('orders').select('*').eq('order_number', orderNumber).single()
  return { orderNumber, row: row! }
}

describe('place_order', () => {
  const made: string[] = []
  afterAll(async () => { for (const n of made) await admin.from('orders').delete().eq('order_number', n) })

  it('recomputes price from product_sizes and charges $9.99 shipping under $150', async () => {
    const { data, error } = await place([{ size_id: cheapId, quantity: 1 }])
    expect(error).toBeNull()
    made.push(data.order_number)
    const { data: order } = await admin.from('orders').select('*').eq('order_number', data.order_number).single()
    expect(Number(order!.subtotal)).toBeCloseTo(cheapPrice, 2)
    expect(Number(order!.shipping_cost)).toBeCloseTo(9.99, 2)
    expect(order!.status).toBe('pending')
    expect(order!.payment_status).toBe('unpaid')
    expect(/^KL-\d{8}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/.test(order!.order_number)).toBe(true)
  })

  it('applies a volume discount at qty 3 (15%)', async () => {
    const { data } = await place([{ size_id: cheapId, quantity: 3 }])
    made.push(data.order_number)
    const { data: order } = await admin.from('orders').select('*').eq('order_number', data.order_number).single()
    expect(Number(order!.discount_total)).toBeCloseTo(cheapPrice * 3 * 0.15, 2)
  })

  it('rejects an empty cart and an unknown size', async () => {
    await expect(place([])).resolves.toMatchObject({ error: expect.objectContaining({ message: expect.stringMatching(/empty/i) }) })
    const bad = await place([{ size_id: '00000000-0000-0000-0000-000000000000', quantity: 1 }])
    expect(bad.error).not.toBeNull()
  })
})

describe('place_order shipping', () => {
  it('prices + records each method × tier from the server-side matrix', async () => {
    const underQty = 1 // one unit is < $150 for a normal size
    const overQty = Math.ceil(150 / cheapPrice) + 2 // push merch >= 150 even after volume discount

    for (const method of ['standard', 'priority'] as ShippingMethod[]) {
      for (const qty of [underQty, overQty]) {
        const { orderNumber, row } = await placeAndRead(cheapId, qty, method)
        const merch = Number(row.subtotal) - Number(row.discount_total)
        expect(row.shipping_method).toBe(method)
        expect(Number(row.shipping_cost)).toBeCloseTo(shippingCost(method, merch), 2)
        expect(Number(row.total)).toBeCloseTo(merch + shippingCost(method, merch), 2)
        await admin.from('orders').delete().eq('order_number', orderNumber)
      }
    }
  })
})
