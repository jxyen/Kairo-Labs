'use server'
import { revalidatePath } from 'next/cache'
import { requireStaff } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { restock, adjust, listMovements, type Movement } from '@/lib/admin/inventory'

export type ActionState = { error?: string; ok?: boolean }

export async function restockAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireStaff()
  const sizeId = String(formData.get('sizeId') ?? '')
  const qty = Number(formData.get('qty'))
  if (!sizeId) return { error: 'Missing SKU.' }
  if (!Number.isInteger(qty) || qty <= 0) return { error: 'Enter a positive whole number to restock.' }
  try {
    const supabase = await createClient()
    await restock(supabase, { sizeId, qty, createdBy: staff.id })
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Restock failed.' }
  }
  revalidatePath('/admin/inventory')
  return { ok: true }
}

export async function adjustAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireStaff()
  const sizeId = String(formData.get('sizeId') ?? '')
  const delta = Number(formData.get('delta'))
  const note = String(formData.get('note') ?? '')
  if (!sizeId) return { error: 'Missing SKU.' }
  if (!Number.isInteger(delta) || delta === 0) return { error: 'Enter a non-zero whole number (e.g. -2 or 5).' }
  if (!note.trim()) return { error: 'A note is required for adjustments.' }
  try {
    const supabase = await createClient()
    await adjust(supabase, { sizeId, delta, note, createdBy: staff.id })
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Adjustment failed.' }
  }
  revalidatePath('/admin/inventory')
  return { ok: true }
}

export async function fetchMovementsAction(sizeId: string): Promise<Movement[]> {
  await requireStaff()
  const supabase = await createClient()
  return listMovements(supabase, sizeId)
}
