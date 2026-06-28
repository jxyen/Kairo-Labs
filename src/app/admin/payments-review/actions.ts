'use server'
import { refresh } from 'next/cache'
import { requireStaff } from '@/lib/auth/dal'
import { createAdminClient } from '@/lib/supabase/admin'
import { applyEventSchema, dismissEventSchema } from './actions-schema'

export async function applyEvent(eventId: string, orderNumber: string) {
  await requireStaff()
  const parsed = applyEventSchema.safeParse({ eventId, orderNumber })
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message }
  const supabase = createAdminClient()
  const { error } = await supabase.rpc('apply_payment_event', {
    p_event_id: parsed.data.eventId,
    p_order_number: parsed.data.orderNumber,
  })
  if (error) return { ok: false as const, error: error.message }
  refresh()
  return { ok: true as const }
}

export async function dismissEvent(eventId: string) {
  await requireStaff()
  const parsed = dismissEventSchema.safeParse({ eventId })
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message }
  const supabase = createAdminClient()
  const { error } = await supabase.from('payment_events')
    .update({ status: 'ignored' }).eq('id', parsed.data.eventId)
  if (error) return { ok: false as const, error: error.message }
  refresh()
  return { ok: true as const }
}
