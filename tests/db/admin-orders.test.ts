import { afterEach, describe, expect, it } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import {
  listOrders,
  getOrder,
  transitionOrderStatus,
  setOrderNotes,
  markOrderPaid,
  TransitionError,
  AlreadyPaidError,
} from '@/app/admin/orders/orders-data'

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

const created: string[] = []
afterEach(async () => {
  for (const id of created.splice(0)) await admin.from('orders').delete().eq('id', id)
})

type Status = Database['public']['Enums']['order_status']

async function newOrder(opts: { status?: Status; paid?: boolean; method?: 'venmo' | 'cashapp' | 'zelle'; total?: number } = {}) {
  const order_number = `KL-20260828-A${Math.floor(Math.random() * 9000 + 1000)}`
  const status = opts.status ?? 'pending'
  const { data, error } = await admin.from('orders').insert({
    order_number, customer_name: 'Admin Orders Test', customer_email: 'aot@example.com',
    shipping_address: { line1: '1 Test St', city: 'Austin', state: 'TX', postal_code: '78701', country: 'US' },
    status, payment_method: opts.method ?? 'venmo',
    payment_status: opts.paid ?? status !== 'pending' ? 'paid' : 'unpaid',
    subtotal: opts.total ?? 50, total: opts.total ?? 50,
  }).select().single()
  if (error) throw error
  created.push(data.id)
  return data
}

async function addItem(orderId: string, name: string, mg: string | null, qty: number, price: number) {
  const { error } = await admin.from('order_items').insert({
    order_id: orderId, product_name: name, mg, unit_price: price, quantity: qty, line_total: price * qty,
  })
  if (error) throw error
}

describe('listOrders', () => {
  it('returns newest first with the line items needed for the summary column', async () => {
    const older = await newOrder()
    const newer = await newOrder()
    await addItem(newer.id, 'GHK-Cu', '50 mg', 3, 40)
    const rows = await listOrders(admin, 'all')
    const iOlder = rows.findIndex((r) => r.id === older.id)
    const iNewer = rows.findIndex((r) => r.id === newer.id)
    expect(iNewer).toBeGreaterThanOrEqual(0)
    expect(iNewer).toBeLessThan(iOlder)
    expect(rows[iNewer].order_items).toEqual([{ product_name: 'GHK-Cu', mg: '50 mg', quantity: 3 }])
    expect(rows[iNewer].customer_name).toBe('Admin Orders Test')
  })

  it('applies the status bucket filter', async () => {
    const pending = await newOrder({ status: 'pending' })
    const paid = await newOrder({ status: 'paid' })
    const fulfilled = await newOrder({ status: 'fulfilled' })
    const shipped = await newOrder({ status: 'shipped' })
    const ids = (rows: { id: string }[]) => rows.map((r) => r.id)

    const toShip = ids(await listOrders(admin, 'to_ship'))
    expect(toShip).toContain(paid.id)
    expect(toShip).toContain(fulfilled.id)
    expect(toShip).not.toContain(pending.id)
    expect(toShip).not.toContain(shipped.id)

    const needsPayment = ids(await listOrders(admin, 'needs_payment'))
    expect(needsPayment).toContain(pending.id)
    expect(needsPayment).not.toContain(paid.id)
  })
})

describe('getOrder', () => {
  it('returns the order with items, payments and shipments', async () => {
    const o = await newOrder({ status: 'shipped' })
    await addItem(o.id, 'BPC-157', '5 mg', 2, 30)
    await admin.from('payments').insert({ order_id: o.id, method: 'venmo', amount: 50, status: 'confirmed', reference: o.order_number })
    await admin.from('shipments').insert({ order_id: o.id, tracking_number: '9400TEST', status: 'shipped' })

    const detail = await getOrder(admin, o.id)
    expect(detail).not.toBeNull()
    expect(detail!.order_number).toBe(o.order_number)
    expect(detail!.shipping_address).toMatchObject({ line1: '1 Test St', city: 'Austin' })
    expect(detail!.order_items).toHaveLength(1)
    expect(detail!.order_items[0]).toMatchObject({ product_name: 'BPC-157', mg: '5 mg', quantity: 2 })
    expect(detail!.payments).toHaveLength(1)
    expect(detail!.payments[0]).toMatchObject({ method: 'venmo', status: 'confirmed' })
    expect(detail!.shipments[0]).toMatchObject({ tracking_number: '9400TEST' })
  })

  it('returns null for an unknown id', async () => {
    expect(await getOrder(admin, '00000000-0000-0000-0000-000000000000')).toBeNull()
  })
})

describe('transitionOrderStatus', () => {
  it('moves paid → shipped and records the tracking number as a shipment', async () => {
    const o = await newOrder({ status: 'paid' })
    await transitionOrderStatus(admin, { id: o.id, to: 'shipped', trackingNumber: '1Z999TEST' })
    const { data: after } = await admin.from('orders').select('status, updated_at').eq('id', o.id).single()
    expect(after!.status).toBe('shipped')
    expect(new Date(after!.updated_at).getTime()).toBeGreaterThan(new Date(o.updated_at).getTime())
    const { data: ships } = await admin.from('shipments').select('tracking_number, status').eq('order_id', o.id)
    expect(ships).toEqual([{ tracking_number: '1Z999TEST', status: 'shipped' }])
  })

  it('does not create a shipment row when no tracking number is given', async () => {
    const o = await newOrder({ status: 'paid' })
    await transitionOrderStatus(admin, { id: o.id, to: 'shipped' })
    const { data: ships } = await admin.from('shipments').select('id').eq('order_id', o.id)
    expect(ships).toEqual([])
  })

  it('rejects a disallowed transition and leaves the order untouched', async () => {
    const o = await newOrder({ status: 'pending' })
    await expect(transitionOrderStatus(admin, { id: o.id, to: 'shipped' })).rejects.toBeInstanceOf(TransitionError)
    const { data: after } = await admin.from('orders').select('status').eq('id', o.id).single()
    expect(after!.status).toBe('pending')
  })

  it('throws on an unknown order', async () => {
    await expect(
      transitionOrderStatus(admin, { id: '00000000-0000-0000-0000-000000000000', to: 'cancelled' }),
    ).rejects.toThrow(/not found/i)
  })
})

describe('setOrderNotes', () => {
  it('saves notes and clears them back to null when emptied', async () => {
    const o = await newOrder()
    await setOrderNotes(admin, o.id, '  customer asked for Tuesday delivery  ')
    let { data } = await admin.from('orders').select('notes').eq('id', o.id).single()
    expect(data!.notes).toBe('customer asked for Tuesday delivery')
    await setOrderNotes(admin, o.id, '   ')
    ;({ data } = await admin.from('orders').select('notes').eq('id', o.id).single())
    expect(data!.notes).toBeNull()
  })
})

describe('markOrderPaid', () => {
  it('flips the order to paid via the RPC using the method staff actually saw', async () => {
    const o = await newOrder({ method: 'venmo', total: 42.5 })
    const number = await markOrderPaid(admin, admin, { id: o.id, method: 'zelle', reference: 'ZL-ABC123' })
    expect(number).toBe(o.order_number)
    const { data: after } = await admin.from('orders').select('status, payment_status, payment_method').eq('id', o.id).single()
    expect(after).toEqual({ status: 'paid', payment_status: 'paid', payment_method: 'zelle' })
    const { data: pays } = await admin.from('payments').select('method, amount, status, reference').eq('order_id', o.id)
    expect(pays).toHaveLength(1)
    expect(pays![0]).toMatchObject({ method: 'zelle', status: 'confirmed', reference: 'ZL-ABC123' })
    expect(Number(pays![0].amount)).toBe(42.5)
  })

  it('keeps the RPC default reference (order number) when none is given', async () => {
    const o = await newOrder({ method: 'cashapp' })
    await markOrderPaid(admin, admin, { id: o.id, method: 'cashapp' })
    const { data: pays } = await admin.from('payments').select('reference').eq('order_id', o.id)
    expect(pays![0].reference).toBe(o.order_number)
  })

  it('refuses to mark an already-paid order', async () => {
    const o = await newOrder({ status: 'paid' })
    await expect(markOrderPaid(admin, admin, { id: o.id, method: 'venmo' })).rejects.toBeInstanceOf(AlreadyPaidError)
    const { data: pays } = await admin.from('payments').select('id').eq('order_id', o.id)
    expect(pays).toEqual([])
  })
})
