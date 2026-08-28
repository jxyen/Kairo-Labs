import { vi } from 'vitest'
vi.mock('@/lib/auth/dal', () => ({ requireStaff: async () => ({ id: 'test', role: 'owner', active: true }) }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => {
    const { createClient } = await import('@supabase/supabase-js')
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
  },
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('@supabase/supabase-js')
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
  },
}))
const refresh = vi.fn()
vi.mock('next/cache', () => ({ refresh: () => refresh() }))

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { markPaidAction, setStatusAction, saveNotesAction } from '@/app/admin/orders/actions'

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

const created: string[] = []
beforeEach(() => refresh.mockClear())
afterEach(async () => {
  for (const id of created.splice(0)) await admin.from('orders').delete().eq('id', id)
})

async function newOrder(status: Database['public']['Enums']['order_status'] = 'pending') {
  const order_number = `KL-20260828-B${Math.floor(Math.random() * 9000 + 1000)}`
  const { data, error } = await admin.from('orders').insert({
    order_number, customer_name: 'Actions Test', status,
    payment_method: 'venmo', payment_status: status === 'pending' ? 'unpaid' : 'paid',
    subtotal: 20, total: 20,
  }).select().single()
  if (error) throw error
  created.push(data.id)
  return data
}

describe('markPaidAction', () => {
  it('rejects a malformed order id before touching the database', async () => {
    const r = await markPaidAction({ orderId: 'nope', method: 'venmo' })
    expect(r.ok).toBe(false)
    expect(refresh).not.toHaveBeenCalled()
  })
  it('rejects a method that is not in the enum', async () => {
    const o = await newOrder()
    const r = await markPaidAction({ orderId: o.id, method: 'paypal' as never })
    expect(r.ok).toBe(false)
  })
  it('marks the order paid with the chosen method and refreshes the page', async () => {
    const o = await newOrder()
    const r = await markPaidAction({ orderId: o.id, method: 'cashapp', reference: '$kairo 8/28' })
    expect(r).toEqual({ ok: true })
    expect(refresh).toHaveBeenCalledTimes(1)
    const { data } = await admin.from('orders').select('status, payment_status, payment_method').eq('id', o.id).single()
    expect(data).toEqual({ status: 'paid', payment_status: 'paid', payment_method: 'cashapp' })
  })
  it('surfaces the already-paid error as a message', async () => {
    const o = await newOrder('paid')
    const r = await markPaidAction({ orderId: o.id, method: 'venmo' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/already/i)
    expect(refresh).not.toHaveBeenCalled()
  })
})

describe('setStatusAction', () => {
  it('cancels a pending order', async () => {
    const o = await newOrder()
    const r = await setStatusAction({ orderId: o.id, to: 'cancelled' })
    expect(r).toEqual({ ok: true })
    expect(refresh).toHaveBeenCalledTimes(1)
    const { data } = await admin.from('orders').select('status').eq('id', o.id).single()
    expect(data!.status).toBe('cancelled')
  })
  it('returns the workflow error for a disallowed move', async () => {
    const o = await newOrder()
    const r = await setStatusAction({ orderId: o.id, to: 'shipped' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/pending to shipped/)
    expect(refresh).not.toHaveBeenCalled()
  })
  it('ships a paid order with a tracking number', async () => {
    const o = await newOrder('paid')
    const r = await setStatusAction({ orderId: o.id, to: 'shipped', trackingNumber: ' 9400 1234 ' })
    expect(r).toEqual({ ok: true })
    const { data } = await admin.from('shipments').select('tracking_number').eq('order_id', o.id)
    expect(data).toEqual([{ tracking_number: '9400 1234' }])
  })
})

describe('saveNotesAction', () => {
  it('stores the notes and refreshes', async () => {
    const o = await newOrder()
    const r = await saveNotesAction({ orderId: o.id, notes: 'gift wrap' })
    expect(r).toEqual({ ok: true })
    expect(refresh).toHaveBeenCalledTimes(1)
    const { data } = await admin.from('orders').select('notes').eq('id', o.id).single()
    expect(data!.notes).toBe('gift wrap')
  })
})
