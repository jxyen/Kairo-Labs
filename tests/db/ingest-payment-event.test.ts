import { afterEach, describe, expect, it } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

const orderIds: string[] = []
const eventKeys: string[] = []
afterEach(async () => {
  for (const id of orderIds.splice(0)) await admin.from('orders').delete().eq('id', id)
  for (const k of eventKeys.splice(0)) await admin.from('payment_events').delete().eq('dedup_key', k)
})

async function newOrder(opts: {
  amount: number; method?: 'venmo' | 'cashapp' | 'zelle'; number?: string; createdDaysAgo?: number
}) {
  const { amount, method = 'venmo', number, createdDaysAgo } = opts
  const order_number = number ?? `KL-20260628-X${Math.floor(Math.random() * 9000 + 1000)}`
  const row: Record<string, unknown> = {
    order_number, customer_name: 'Test', status: 'pending',
    payment_method: method, payment_status: 'unpaid', subtotal: amount, total: amount,
  }
  if (createdDaysAgo != null) {
    row.created_at = new Date(Date.now() - createdDaysAgo * 86400_000).toISOString()
  }
  const { data, error } = await admin.from('orders').insert(row).select().single()
  if (error) throw error
  orderIds.push(data!.id)
  return data!
}

function payload(over: Partial<Record<string, unknown>>) {
  const dedup_key = `dk-${Math.random().toString(36).slice(2)}`
  eventKeys.push(dedup_key)
  return {
    channel: 'push', method: 'venmo', amount: 0, sender: 'Someone',
    note: null, raw_text: 'You received', external_id: null,
    received_at: new Date().toISOString(), dedup_key, ...over,
  }
}

async function ingest(p: Record<string, unknown>) {
  const { data, error } = await admin.rpc('ingest_payment_event', { p_payload: p })
  expect(error).toBeNull()
  return data as { status: string; order_number: string | null; event_id: string }
}

describe('ingest_payment_event', () => {
  it('auto-applies a single exact amount+method match', async () => {
    const o = await newOrder({ amount: 111.01 })
    const r = await ingest(payload({ amount: 111.01, method: 'venmo' }))
    expect(r.status).toBe('applied')
    expect(r.order_number).toBe(o.order_number)
    const { data } = await admin.from('orders').select('payment_status').eq('id', o.id).single()
    expect(data!.payment_status).toBe('paid')
  })

  it('auto-applies when a KL code in raw_text resolves to a matching order', async () => {
    const o = await newOrder({ amount: 111.02 })
    const r = await ingest(payload({
      amount: 111.02, method: 'venmo', raw_text: `Payment received note ${o.order_number} thanks`,
    }))
    expect(r.status).toBe('applied')
    expect(r.order_number).toBe(o.order_number)
  })

  it('does NOT auto-apply a code whose amount disagrees', async () => {
    const o = await newOrder({ amount: 111.03 })
    const r = await ingest(payload({
      amount: 999.99, method: 'venmo', raw_text: `note ${o.order_number}`,
    }))
    expect(r.status).toBe('unmatched')
    const { data } = await admin.from('orders').select('payment_status').eq('id', o.id).single()
    expect(data!.payment_status).toBe('unpaid')
  })

  it('marks ambiguous when two unpaid orders share amount+method', async () => {
    const a = await newOrder({ amount: 111.04 })
    const b = await newOrder({ amount: 111.04 })
    const r = await ingest(payload({ amount: 111.04, method: 'venmo' }))
    expect(r.status).toBe('ambiguous')
    const { data } = await admin.from('payment_events').select('candidate_orders').eq('id', r.event_id).single()
    expect(data!.candidate_orders).toEqual(expect.arrayContaining([a.order_number, b.order_number]))
    for (const o of [a, b]) {
      const { data: od } = await admin.from('orders').select('payment_status').eq('id', o.id).single()
      expect(od!.payment_status).toBe('unpaid')
    }
  })

  it('is unmatched when nothing matches', async () => {
    const r = await ingest(payload({ amount: 111.05, method: 'venmo' }))
    expect(r.status).toBe('unmatched')
  })

  it('does not match a different method', async () => {
    await newOrder({ amount: 111.06, method: 'cashapp' })
    const r = await ingest(payload({ amount: 111.06, method: 'venmo' }))
    expect(r.status).toBe('unmatched')
  })

  it('does not match an order older than the 30-day window', async () => {
    await newOrder({ amount: 111.07, createdDaysAgo: 45 })
    const r = await ingest(payload({ amount: 111.07, method: 'venmo' }))
    expect(r.status).toBe('unmatched')
  })

  it('treats a redelivered dedup_key as a duplicate (no second apply)', async () => {
    const o = await newOrder({ amount: 111.08 })
    const p = payload({ amount: 111.08, method: 'venmo' })
    const r1 = await ingest(p)
    expect(r1.status).toBe('applied')
    const r2 = await ingest(p) // same dedup_key
    expect(r2.status).toBe('duplicate')
    const { data: pays } = await admin.from('payments').select('id').eq('order_id', o.id)
    expect(pays!.length).toBe(1)
  })
})
