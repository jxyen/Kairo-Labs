'use server'
import { refresh } from 'next/cache'
import { requireStaff } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { markPaidSchema, setStatusSchema, saveNotesSchema } from './actions-schema'
import type { MarkPaidInput, SetStatusInput, SaveNotesInput } from './actions-schema'
import { markOrderPaid, setOrderNotes, transitionOrderStatus } from './orders-data'

export type ActionResult = { ok: true } | { ok: false; error: string }

function fail(err: unknown): ActionResult {
  return { ok: false, error: err instanceof Error ? err.message : 'Something went wrong.' }
}

/**
 * Mark an unpaid order paid. Goes through the mark_order_paid RPC (service
 * role — its EXECUTE is revoked from `authenticated`); every other read/write
 * stays on the RLS client.
 */
export async function markPaidAction(input: MarkPaidInput): Promise<ActionResult> {
  await requireStaff()
  const parsed = markPaidSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
  const { orderId, method, reference } = parsed.data
  try {
    await markOrderPaid(await createClient(), createAdminClient(), { id: orderId, method, reference })
  } catch (err) {
    return fail(err)
  }
  refresh() // no auto router refresh after a mutation — re-render the detail page
  return { ok: true }
}

/** Move an order along the workflow (see STATUS_TRANSITIONS); optional tracking on ship. */
export async function setStatusAction(input: SetStatusInput): Promise<ActionResult> {
  await requireStaff()
  const parsed = setStatusSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
  const { orderId, to, trackingNumber } = parsed.data
  try {
    await transitionOrderStatus(await createClient(), { id: orderId, to, trackingNumber })
  } catch (err) {
    return fail(err)
  }
  refresh()
  return { ok: true }
}

/** Replace the internal notes on an order. */
export async function saveNotesAction(input: SaveNotesInput): Promise<ActionResult> {
  await requireStaff()
  const parsed = saveNotesSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
  try {
    await setOrderNotes(await createClient(), parsed.data.orderId, parsed.data.notes)
  } catch (err) {
    return fail(err)
  }
  refresh()
  return { ok: true }
}
